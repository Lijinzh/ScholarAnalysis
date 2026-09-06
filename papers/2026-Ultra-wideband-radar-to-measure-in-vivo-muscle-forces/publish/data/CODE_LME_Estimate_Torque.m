clear variables
load("DATA_Dynamic_Knee.mat");

table_names = ["Torque", "a"+string(1:204), "Condition"];

% Initialise Outputs
R2s = zeros(6,5);
NRMSEs = zeros(6,5);
EstimatedTorque = {};
TrueTorque = {};
LMEs = {};

% Run 5-fold Cross-Validation (CV) for all 6 participants
for pId = 1:6
for CV = 1 : 5

disp("pId: " + string(pId) + ", CV: " + string(CV))

% Select data from target participant
t_angle = total_angle(total_part==pId);
t_len = total_len(total_part==pId);
t_pen = total_pen(total_part==pId);
t_vel = total_vel(total_part==pId);
t_torque = total_torque(total_part==pId);
t_emg = total_emg(total_part==pId);
t_uwb = total_uwb(:,total_part==pId);
t_run = total_run(total_part==pId);

% Normalise Torque
t_torque = t_torque / max(abs(t_torque));

% Split data for 5-fold Cross-Validation (CV)
torque_train = [];      % Torque data
torque_test = [];
uwb_train = [];         % UWB data
uwb_test = [];
run_train = [];         % Different conditions
run_test = [];
for i = 1 : length(t_torque)
    if mod(i, 5) + 1 == CV
        torque_test = [torque_test, t_torque(i)];
        uwb_test = [uwb_test, t_uwb(:,i)];
        run_test = [run_test, t_run(i)];
    else
        torque_train = [torque_train, t_torque(i)];
        uwb_train = [uwb_train, t_uwb(:,i)];
        run_train = [run_train, t_run(i)];
    end
end

% Organise data into tables for LMEs
t_train = array2table([torque_train',uwb_train',run_train'], VariableNames=table_names);
t_test = array2table([torque_test',uwb_test',run_test'], VariableNames=table_names);

% Construct an LME with all 204 UWB traces as predictors
eq = "Torque ~ ";
for i = 1 : 204
    eq = eq + "a" + string(i) + " + ";
end
eq = eq + "(1 | Condition)"; % Random intercept by condition
lme1 = fitlme(t_train, eq);


% Threshold p-value
p0 = 0.001;

pValues = lme1.Coefficients.pValue;
names = lme1.Coefficients.Name;

% Iteratively remove UWB traces from predictors until all below p threshold
% (max 50 predictors)
while ((sum(pValues(2:end) >= p0) > 0) || (length(pValues) > 50))

    eq = "Torque ~ ";
    % Determine UWB trace with highest p value (to remove)
    [~, idxMax] = max(pValues(2:end));
    idxMax = idxMax + 1;
    % Note the first element in pValues is from intercept, hence '+1'
    for i = 2 : length(pValues)
        if i == idxMax
            continue
        end
        eq = eq + names{i} + " + ";
    end
    eq = eq + "(1 | Condition)";

    % Re-fit LME on revised equation, repeat
    lme2 = fitlme(t_train, eq);
    pValues = lme2.Coefficients.pValue;
    names = lme2.Coefficients.Name;
end


% Predict test torque from final LME
pred = predict(lme2, t_test);

% Find performance metrics, save outputs
SS_res = sum((torque_test-pred').^2);
SS_tot = sum((torque_test-mean(torque_test)).^2);
R2 = 1-(SS_res/SS_tot);

R2s(pId, CV) = R2;

error = torque_test-pred';
nrmse = 100 * sqrt(sum(error.^2)/length(error));

NRMSEs(pId, CV) = nrmse;

EstimatedTorque{pId, CV} = pred';
TrueTorque{pId, CV} = torque_test;
LMEs{pId, CV} = lme2;

end
end

% Save data outputs and trained models
save("LME_Data_Outputs.mat", "R2s", "NRMSEs", "EstimatedTorque", "TrueTorque");
save("LME_Trained_Models.mat", "LMEs");
