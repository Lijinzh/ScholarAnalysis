import scipy.io
import numpy as np

import torch
from torch import nn
from torch.utils.data import Dataset, DataLoader
import torch.nn.functional as F

from math import sqrt



# UWB Dataset
class SequenceDataset(Dataset):
    def __init__(self, data):

        self.data = data

        self.y = torch.tensor(data[-1, 0, :]).float()
        self.X = torch.tensor(data[:, 1:, :]).float()

    def __len__(self):
        return self.X.shape[2]

    def __getitem__(self, i):

        return self.X[:,:,i], self.y[i]


# LSTM Model Architecture
class LSTM(nn.Module):
    def __init__(self, num_sensors, hidden_units):
        super().__init__()
        self.num_sensors = num_sensors
        self.hidden_units = hidden_units
        self.num_layers = 2

        # 2-layer LSTM with 40% dropout
        self.lstm = nn.LSTM(
            input_size=num_sensors,
            hidden_size=hidden_units,
            batch_first=True,
            num_layers=self.num_layers,
            dropout=0.4
        )

        # 128/32/1 fully-connected layers for MLP
        self.linear1 = nn.Linear(in_features=self.hidden_units, out_features=32)
        self.linear2 = nn.Linear(in_features=32, out_features=1)

    def forward(self, x):
        batch_size = x.shape[0]
        h0 = torch.zeros(self.num_layers, batch_size, self.hidden_units).requires_grad_()
        c0 = torch.zeros(self.num_layers, batch_size, self.hidden_units).requires_grad_()

        _, (hn, _) = self.lstm(x, (h0, c0))
        mlp1 = F.relu(self.linear1(hn[-1]))
        out = F.relu(self.linear2(mlp1).flatten())

        return out


# Train model
def train_model(data_loader, model, loss_function, optimizer):
    num_batches = len(data_loader)
    total_loss = 0
    model.train()

    for X, y in data_loader:
        output = model(X)
        loss = loss_function(output, y)

        # Run back-propagation to minimise MSE loss
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()

        total_loss += loss.item()


    avg_loss = total_loss / num_batches

    return avg_loss


# Validate model
def valid_model(data_loader, model, loss_function, validLoss, pID, CV):

    num_batches = len(data_loader)
    total_loss = 0

    model.eval()
    with torch.no_grad():
        for X, y in data_loader:
            output = model(X)
            total_loss += loss_function(output, y).item()

    avg_loss = total_loss / num_batches
    lr_scheduler.step(avg_loss)

    # If new minimum validation loss, save model
    if avg_loss < validLoss:
        validLoss = avg_loss
        torch.save(model.state_dict(), "LSTM_" + pID + "_" + CV + ".pt")
    return avg_loss,validLoss


# Test model
def predict(data_loader, model):

    output = torch.tensor([])
    true = torch.tensor([])

    model.eval()
    with torch.no_grad():
        for X, y in data_loader:
            y_star = model(X)

            output = torch.cat((output, y_star), 0)
            true = torch.cat((true, y), 0)

    return true, output


# Define participant IDs (pIDs) and cross-validation (CV) folds to Run
pIDs = ["P01", "P02", "P03", "P04", "P05", "P06", "P07", "P08", "P09", "P10", "P11", "P12", "P13", "P14", "P15", "P16", "P17", "P18"]
CVs = ["CV1", "CV2", "CV3", "CV4", "CV5"]

for pID in pIDs:
    for CV in CVs:

        torch.manual_seed(0)

        mat = scipy.io.loadmat(pID + '_ML_Data_' + CV + '.mat')

        trainData = np.array(mat['A_train'])
        validData = np.array(mat['A_valid'])
        testData = np.array(mat['A_test'])

        # Create data loaders for training
        train_dataset = SequenceDataset(trainData)
        valid_dataset = SequenceDataset(validData)
        test_dataset = SequenceDataset(testData)

        batch_size = 64
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
        valid_loader = DataLoader(valid_dataset, batch_size=batch_size, shuffle=False)
        test_loader = DataLoader(test_dataset, batch_size=batch_size, shuffle=False)


        device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

        learning_rate = 1e-4
        num_hidden_units = 128

        # Create model
        model = LSTM(num_sensors=204, hidden_units=num_hidden_units)
        loss_function = nn.MSELoss()
        optimizer = torch.optim.Adam(model.parameters(), lr=learning_rate)
        lr_scheduler = torch.optim.lr_scheduler.ReduceLROnPlateau(
            optimizer,
            mode = 'min',
            factor = 0.5,
            patience = 8,
            min_lr = 1e-6
        )

        # Start training
        validLoss = 100
        _,validLoss = valid_model(valid_loader, model, loss_function, validLoss, pID, CV)
        trainLosses = []
        validLosses = []
        for ix_epoch in range(100):
            trainLoss = train_model(train_loader, model, loss_function, optimizer=optimizer)
            avg_loss, validLoss = valid_model(valid_loader, model, loss_function, validLoss, pID, CV)
            trainLosses.append(trainLoss)
            validLosses.append(avg_loss)


        # Test model output on model with minimum validation loss after 100 epochs
        model = LSTM(num_sensors=204, hidden_units=num_hidden_units)
        model.load_state_dict(torch.load("LSTM_" + pID + "_" + CV + ".pt", weights_only=True))
        loss_function = nn.MSELoss()

        # Recreate training data loader without shuffling, for prediction purposes
        train_eval_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=False)

        # Produce predictions of training, validation, and testing datasets
        train_actual, df_train_pred = predict(train_eval_loader, model)
        valid_actual, df_valid_pred = predict(valid_loader, model)
        test_actual, df_test_pred = predict(test_loader, model)

        # Compute performance metrics (R2 & NRMSE) from unseen testing prediction
        SS_res = sum([(test_actual[i] - df_test_pred[i])**2 for i in range(len(test_actual))])
        SS_tot = sum([(test_actual[i] - (sum(test_actual))/len(test_actual))**2 for i in range(len(test_actual))])
        R2 = 1 - (SS_res / SS_tot)

        RMSE = 100 * sqrt(sum([(test_actual[i] - df_test_pred[i])**2 for i in range(len(test_actual))])/len(test_actual))

        print(f"Participant {pID}, Fold {CV}: R2={R2:.4f}, RMSE={RMSE:.3f}")

        # Save all predictions, training losses, and performance metrics
        data_out = {
            "force_testPred": df_test_pred,
            "force_testTrue": test_actual,
            "force_validPred": df_valid_pred,
            "force_validTrue": valid_actual,
            "force_trainPred": df_train_pred,
            "force_trainTrue": train_actual,
            "train_losses": trainLosses,
            "valid_losses": validLosses,
            "R2": R2,
            "RMSE": RMSE
        }
        scipy.io.savemat("DataOut_" + pID + "_" + CV + '.mat', data_out)