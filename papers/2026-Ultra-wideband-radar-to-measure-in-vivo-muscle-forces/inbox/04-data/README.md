# Data from: Ultra-wideband radar to measure *in vivo* muscle forces

Dataset DOI: [10.5061/dryad.sbcc2frmh](https://doi.org/10.5061/dryad.sbcc2frmh)

## Description of the data and file structure

This dataset consists of ultra-wideband radar scan data of skeletal muscle during a series of musculoskeletal contractions. These include of a unipennate knee extensor (vastus lateralis, VL) during isometric knee extension contractions, bipennate ankle dorsiflexor (tibialis anterior, TA) during isometric ankle dorsiflexion contractions, the vastus lateralis during fatiguing isometric knee extensions contractions, and the vastus lateralis during different types of dynamic knee extension contractions (including isokinetic, isotonic, and passive).

The fatiguing isometric knee extension contraction data is used to train long short-term memory (LSTM) machine learning models to estimate muscle forces from the ultra-wideband radar data. Code to generate the training data splits, code to train the machine learning models, and the resultant machine learning models (and their corresponding data outputs) are also included.

The dynamic knee extension contraction data is used to train linear models to estimate knee torques from the ultra-wideband radar data. Code to train the linear models, and the resultant linear models (and their corresponding data outputs) are also included.

### Files and variables

#### File: DATA_Isometric_Knee.xlsx

**Description:** Data collected from the vastus lateralis in 16 participants as they completed isometric knee extension contractions at 5 levels of normalised torque (10%, 20%, 30%, 40% and 50% of their maximum voluntary contraction (MVC)). 

* Sheet "S11 Mag": Average change in ultra-wideband radar reflection coefficient (S11) magnitude (dB, average across 0.1-2.9 GHz range) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on S11 magnitude (*P* < 0.001).
* Sheet "S11 Pha": Average change in ultra-wideband radar reflection coefficient (S11) phase (°, average across 0.1-2.9 GHz range) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on S11 phase (*P* = 0.012).
* Sheet "sEMG": Change in surface electromyography magnitude (mV) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on surface electromyography magnitude (*P* < 0.001).
* Sheet "Fasc. Len": Change in vastus  length (%) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on fascicle length (*P* < 0.001).

<br />

#### File: DATA_Isometric_Ankle.xlsx

**Description:** Data collected from the tibialis anterior in 6 participants as they completed isometric ankle dorsiflexion contractions at 5 levels of normalised torque (10%, 20%, 30%, 40% and 50% MVC). 

* Sheet "S11 Mag": Average change in ultra-wideband radar reflection coefficient (S11) magnitude (dB, average across 0.1-2.9 GHz range) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on S11 magnitude (*P* < 0.001).
* Sheet "S11 Pha": Average change in ultra-wideband radar reflection coefficient (S11) phase (°, average across 0.1-2.9 GHz range) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on S11 phase (*P* = 0.002).
* Sheet "sEMG": Change in surface electromyography magnitude (mV) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on surface electromyography magnitude (*P* < 0.001).
* Sheet "Fasc. Len": Change in fascicle length (%) from rest, at different levels of muscle  force (%MVC). A linear mixed effects model with independent random intercept and slope that varied by participant found a statistically significant fixed effect of force on fascicle length (*P* < 0.001).

<br />

#### File: DATA_Fatiguing_Isometric_Knee.xlsx

**Description:** Data collected in 18 participants as they completed 20-minutes of intermittent isometric knee extension contractions (trapezoidal force curves peaking between 8-45% MVC). Data are resampled to a synchronous 10 Hz sampling rate. Machine learning models were trained to estimate time-varying vastus lateralis muscle forces during these contractions form the ultra-wideband radar scans.

* Sheet "UWB Data": Ultra-wideband radar data consisting of magnitude (dB) and phase (radians) of reflection coefficient (S11) and forward transmission coefficient (S21), at 51 frequencies from 0.1-2.9 GHz.
* Sheet "EMG-Torque Data": Vastus lateralis muscle forces (% MVC), surface electromyography based muscle activations (% normalised to peak), and normalised ratio (%) of muscle force to activation at time points when both signals are at least 5% of their peak (as a metric for the participant's fatigue level, with fatigue indicated by an increase in activation for a given force). Linear models of this fatigue metric against time found that 17 of the 18 participants experienced a statistically significant amount of muscle fatigue over the course of the 20-minute contraction protocol (*P* < 0.001).
* Sheet "Force Estimates (Test Set)": All test set long short-term memory (LSTM) machine learning muscle force estimates  and measured values (both normalised to peak). Each participant has 5 test sets, corresponding to the 5-fold cross validation.

#### File: CODE_Generate_LSTM_Training_Data.zip

**Description:** Contains force and ultra-wideband data for all 18 participants, and a Matlab script that performs the data split with 5-fold cross validation for machine learning (with 60/20/20 training/validation/testing split) in an effort to reduce the risk of over-fitting. The resultant split data can then be used to train models as in 'CODE_Train_LSTM_Models.py'. The data in this file is also contained within 'DATA_Fatiguing_Isometric_Knee.xlsx', here it is just in a form for the Matlab script.

#### File: CODE_Train_LSTM_Models.py

**Description:** Python script to train long short-term memory (LSTM) models to estimate muscle forces from the ultra-wideband radar data. This requires the split data output from running the Matlab script in 'CODE_Generate_LSTM_Training_Data.zip'. The LSTM model consists of two layers of LSTM cells, with 40 cells per layer (using 4 seconds of data at 10 Hz), with the final cell's hidden state being fed into a multi-layer perceptron (of size 128/32/1). LSTM models are trained for up to 100 epochs on the training data, until mean square error is minimised in the validation data, before being evaluated on the unseen test data.

#### File: LSTM_Trained_Models.zip

**Description:** Contains the 90 trained machine learning models (18 participants with 5-fold cross-validation) trained to estimate isometric muscle force in the vastus lateralis during fatiguing conditions from ultra-wideband radar data. These are models created using 'CODE_Train_LSTM_Models.py', trained on data splits created using 'CODE_Train_LSTM_Models.py' (within 'CODE_Generate_LSTM_Training_Data.zip'). All models are in PyTorch '.pt' file format. Models achieved an average test R^2^ of 0.988 and normalised root mean squared error (NRMSE) of 2.7%. 

#### File: LSTM_Data_Outputs.zip

**Description:** Contains model outputs  of all 90 trained machine learning models (18 participants with 5-fold cross-validation) trained to estimate isometric muscle force in the vastus lateralis during fatiguing conditions from ultra-wideband radar data. These are model outputs created using 'CODE_Train_LSTM_Models.py', trained on data splits created using 'CODE_Train_LSTM_Models.py' (within 'CODE_Generate_LSTM_Training_Data.zip'). Each file is a Matlab data file named as "DataOut_[Participant ID]_CV[cross-validation fold].mat", and contains the following:

##### Variables

* R2: Coefficient of determination of the model's test set estimation compared to measured force.
* NRMSE: Normalised root mean squared error of the model's test set estimation against measured force.
* force_[test/train/valid]Pred: Model estimated vastus lateralis forces of the [test/train/valid] data set.
* force_[test/train/valid]True: Measured vastus lateralis forces of the [test/train/valid] data set.
* train_losses: Mean squared error of the training set from the 100 epochs of training.
* valid_losses: Mean squared error of the validation set from the 100 epochs of training.

<br />

#### File: DATA_Dynamic_Knee.xlsx

**Description:** Data collected in 6 participants during 16 dynamic knee extension contractions in a dynamometer (passive, isokinetic, isokinetic with 45% MVC threshold, isotonic). Passive and isokinetic contractions were completed at 30, 60, 90, 120 °/sec, and isotonic contractions at 15%, 30%, 45%, and 60% MVC. Data are resampled to a synchronous 10 Hz sampling rate.

* Sheet "Joint-Muscle Data": Knee torque (% MVC), knee angle (°), surface electromyography (% MVC), vastus lateralis fascicle strain (% from rest), fascicle strain rate (%/s, also referred to as fascicle velocity), and fascicle pennation (° from rest).
* Sheet "UWB Data": Ultra-wideband radar data consisting of magnitude (dB) and phase (radians) of reflection coefficient (S11) and forward transmission coefficient (S21), at 51 frequencies from 0.1-2.9 GHz
* Sheet "Torque Estimates": Measured and linear mixed effects model estimated knee torques (%, both normalised to peak). Models were fitted with 5-fold cross-validation, with this sheet consisting of the reordered test set data.
* Sheet "Effect Sizes": All arbitrary units. Linear mixed effects model effect sizes of surface electromyography, fascicle length, fascicle velocity, and torque on each frequency of the magnitude and phase of S11 and S21 of the ultra-wideband radar data. These demonstrate unique frequency-dependent effects of each neuromuscular parameter on the ultra-wideband radar signal.
* Sheet "Effect Sizes Pennation": All arbitrary units. Linear mixed effects model effect sizes of surface electromyography, fascicle pennation (instead of fascicle length as above), fascicle velocity, and torque on each frequency of the magnitude and phase of S11 and S21 of the ultra-wideband radar data. As fascicle length was found to remain well coupled with pennation, only one could be used at a time in these models. These demonstrate unique frequency-dependent effects of each neuromuscular parameter on the ultra-wideband radar signal, with effect sizes of surface electromyography, fascicle velocity, and torque remaining consistent with those found when the models used fascicle length instead of pennation.

#### File: DATA_Dynamic_Knee.mat

**Description:** All data in this file is contained within 'DATA_Dynamic_Knee.xlsx'. This form of the data is used by 'CODE_LME_Estimate_Torque.m'. Each data point along the 3226-long dimension corresponds to a single time sample.

##### Variables

* total_angle: Knee angle, measured with the dynamometer.
* total_emg: Activation of the vastus lateralis found using surface electromyography.
* total_len: Fascicle length of the vastus lateralis found using B-mode ultrasound.
* total_part: The participant number (1-6).
* total_pen: Fascicle pennation angle of the vastus lateralis found using B-mode ultrasound.
* total_run: Number of the current condition.
* total_torque: Knee torque, measured with the dynamometer.
* total_uwb: Ultra-wideband radar scans (51 frequencies 100MHz-2.9GHz, with magnitude and phase of S11 and S21).
* total_vel: Fascicle velocity of the vastus lateralis, derived from fascicle length measures.

#### File: CODE_LME_Estimate_Torque.m

**Description:** A MATLAB script that uses the data contained in 'DATA_Dynamic_Knee.mat' to estimate dynamic knee torques from the ultra-wideband radar signal. Data outputs and resulting models correspond to 'LME_Data_Outputs.mat' and 'LME_Trained_Models.mat'. Linear models are fit to the training dataset with maximum likelihood estimation, with torque as response variable and starting with all 204 ultra-wideband traces (51 frequencies of magnitude and phase of S11 and S21) as predictor variables. Ultra-wideband traces are iteratively removed one at a time by largest P-value (re-fitting the model between each removal), until all fixed effects are statistically significant (*P* < 0.001) and there are fewer than 50 predictors. The resultant model is then evaluated on the unseen test dataset.

#### File: LME_Trained_Models.mat

**Description:** All 30 trained linear mixed effects models (6 participants, 5-fold cross validation), corresponding to 'LME_Data_Outputs.mat' and 'CODE_LME_Estimate_Torque.m'. Models achieved an average test R^2^ of 0.984 and NRMSE of 3.3%. 

##### Variables

* A 6x5 matrix of the final linear mixed effects models.

#### File: LME_Data_Outputs.mat

**Description:** Estimated torques and performance metrics of all 30 linear mixed effects models (6 participants, with 5-fold cross-validation) to estimate knee torque from the ultra-wideband radar, corresponding to 'CODE_LME_Estimate_Torque.m'.

##### Variables

* EstimateTorque: 6x5 matrix of the output estimated torques for all 30 LME models.
* NRMSEs: 6x5 matrix of test normalised root mean squared errors of EstimateTorque against TrueTorque for all 30 LME models.
* R2s: 6x5 matrix of test coefficients of determination of EstimateTorque against TrueTorque for all 30 LME models.
* TrueTorque: 6x5 matrix of measured torques, used as ground truth for performance assessment of all 30 LME models.

## Code/software

The script 'CODE_Train_LSTM_Models.py' runs on Python 3.12.2 (other versions should work), and requires SciPy, NumPy, and PyTorch packages.

All Matlab scripts run on R2021b (other versions should work).


## Human subjects data

All data is non-identifiable, and participants provided written informed consent for its collection and use.