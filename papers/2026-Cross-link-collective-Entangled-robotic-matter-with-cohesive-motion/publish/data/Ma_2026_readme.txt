This readme file was generated on 2026-01-19 by Danna Ma.

# GENERAL INFORMATION

* Title of Dataset: Data from Cross-link Collective: Entangled Robotic Matter with Cohesive Motion

## Principal Investigator Information
Name: Kirstin Petersen
ORCID: 0000-0002-7813-5621
Institution: Cornell University
Address: Rhodes Hall, Room 324, 105 Campus Rd, Ithaca, NY
Email: kirstin@cornell.edu

## Author Information
Name: Danna Ma
ORCID: 0000-0002-9692-3699
Institution: Cornell University
Address: CIS Bowers Building Rm 418, 136 Hoy Rd, Ithaca, NY 14850
Email: dannama@cornell.edu

Data was collected from 2023-09-01 to 2025-12-15 at 42.44° N, -76.50° W, Ithaca, New York, USA.
The collection of this data is supported by the National Science Foundation under Grant No. 2042411 and 1933284, as well as a Packard Fellowship for Science and Engineering.

# SHARING/ACCESS INFORMATION

* Licenses/restrictions placed on the data: This dataset is shared under an Attribution 4.0 International (CC BY 4.0) license (https://creativecommons.org/licenses/by/4.0/). The material can be shared and built upon, but attribution to the original authors and a statement of changes made is required.
* Links to publications that cite or use the data: Ma, D., Petersen, K., Chong, B., & Goldman, D. (2026). Cross-link collective: Entangled robotic matter with cohesive motion. Science Robotics. (In press)
* Recommended citation for this dataset: Ma, D., Petersen, K., Chong, B., & Goldman, D. (2026). Data from Cross-link collective: Entangled robotic matter with cohesive motion [Data set]. Zenodo. https://doi.org/10.5281/zenodo.18271890

# DATA & FILE OVERVIEW

## File List:
Code.zip contains all Python and MATLAB code required for module detection, trajectory extraction, and collective behavior analysis. Other zip folders contain original videos for various experiments.

Main directories:

Code/
├── Undulation Motor Torque.zip              # MATLAB model for undulation motor torque analysis
│
└── Video Analysis.zip                       # Video processing and collective behavior analysis pipeline

After video analysis:

Video Analysis/
├── Robot-Object-Detection-main.zip          # Python YOLOv8 object detection pipeline
├── robot-wing-tracing.v6i.coco.zip          # YOLO training dataset and annotations
├── Calibrations.zip                         # Camera and spatial calibration files
├── track_analysis.m                         # Generate module trajectories from detections
├── chain_analysis.m                         # Extract chain connectivity and collective behavior metrics
└── src/                                     # MATLAB helper functions and analysis utilities
    ├── setup.m                              # Configure MATLAB paths and required directories
    ├── trackChains.m                        # Chain tracking utilities
    ├── matchBlobsWithTracks.m               # Associate visual blobs with tracked modules
    ├── manualCorrection.m                   # Manual trajectory correction
    ├── analyzeTrajectories.m                # Trajectory analysis functions
    ├── genericChainAnalysis.m               # Chain statistics and analysis
    └── additional helper functions


### Experimental video folders
All remaining zip folders contain raw experimental videos corresponding to the experiments described in the manuscript.
These videos serve as input to the YOLOv8 detection and MATLAB analysis pipelines.

### Generated outputs
Running the analysis pipeline generates:
- module trajectory data
- chain connectivity data
- MATLAB (.mat) analysis files
- processed collective behavior metrics

## Quick Start Guide
1. Extract Code.zip.
2. Run the Python YOLOv8 detection pipeline in:
   Robot-Object-Detection-main/
   Follow the README.md to generate module detection outputs from experimental videos.
3. Open MATLAB and set the current directory that contains the output from the YOLOv8 model
4. Run setup.m to configure MATLAB paths and required directories.
5. Run:
   - track_analysis.m to generate module trajectories
   - chain_analysis.m to extract chain connectivity and collective behavior metrics

## Processing workflow:
1. Experimental videos are processed using the Python YOLOv8 pipeline in: Code/Robot-Object-Detection-main/
2. The detector outputs frame-by-frame module detections as MAT files.
3. Detection CSVs are imported into MATLAB scripts in: Code/Video Analysis/src/
4. MATLAB scripts generate:
   - module trajectories
   - chain connectivity information
   - collective motion metrics
5. Processed outputs are saved as MAT files.


# METHODOLOGICAL INFORMATION

## Description of methods used for collection/generation of data:
All experiments were performed on whiteboard surfaces with controlled lighting and overhead camera (Logitech C920) recording.

## Methods for processing the data:
To extract the location of all modules in each video frame, we used the YOLOv8-Oriented Bounding Boxes (Mitrev and Mirceva, 2025) multi-object tracking. We trained the YOLO network using 333 manually labeled frames, in which the joints and
tips of the two outer links of each module were marked. To generate module trajectories, we used a Hungarian algorithm to match module locations over consecutive frames, and finally did a manual pas to ensure data validity. To further extract entangled chain configurations and trajectories, we extracted appropriately sized visual blobs in each frame, and matched them with module trajectories and IDs to further generate chain analytics over time. Because chains were identified visually, many of these chains occur because of physical proximity, not Velcro® bonds.
When applicable, cross-linked modules (modules connected via Velcro ®) were tracked manually.

# DATA-SPECIFIC INFORMATION FOR: Supplementary Material Videos
* Number of Videos: 7
* Video List:
	CrosslinkCollective-SM-Video1: Close-up view of the crank-slider mechanism for a module completing a nominal oscillation cycle
	CrosslinkCollective-SM-Video2: Cross-link collective passing a funnel on an incline; Cross-link collective transition from jammed to unjammed state
	CrosslinkCollective-SM-Video3: Collective motion with and without Velcro® on level surfaces
	CrosslinkCollective-SM-Video4: Example motion of two modules in S-, W-, G- and C-configurations
	CrosslinkCollective-SM-Video5: Collective behavior of 5, 10, 15 and 20 modules in presence of external forces
	CrosslinkCollective-SM-Video6: The progress of a single module is orientation dependent with respect to the external force direction
	CrosslinkCollective-SM-Video7: Controller demonstration: motion of a single module and two modules in a chain; Collective behavior with and without controller on incline
* Format: MP4

# DATA-SPECIFIC INFORMATION FOR: NoControl_FiveRepetitions - Ten module collective behavior without controller on incline
* Number of Videos: 5
* Video List: NoControl_Rep1_100X to NoControl_Rep5_100X
* Format: MP4

# DATA-SPECIFIC INFORMATION FOR: WithControl_FiveRepetitions - Ten module collective behavior with controller on incline
* Number of Videos: 5
* Video List: WithControl_Rep1_100X to WithControl_Rep5_100X
* Format: MP4

# DATA-SPECIFIC INFORMATION FOR: FlatWithVelcro_TenRepetitions - Ten module collective motion with Velcro® on level surfaces
* Number of Videos: 10
* Video List: FlatWithVelcro_1 to FlatWithVelcro_10
* Format: MKV

# DATA-SPECIFIC INFORMATION FOR: FlatWithoutVelcro_TenRepetitions - Ten module collective motion without Velcro® on level surfaces
* Number of Videos: 10
* Video List: FlatWithoutVelcro_1 to FlatWithoutVelcro_10
* Format: MKV

# DATA-SPECIFIC INFORMATION FOR: NoObstacleWithControl_Reps - Ten module collective motion with Velcro®, with control and without obstacles on level surfaces
* Number of Videos: 6
* Video List: NoObstacleWithControl_1 to NoObstacleWithControl_6
* Format: MP4

# DATA-SPECIFIC INFORMATION FOR: 5DegreeSlopeGlide_5Robots- Five module collective motion with Velcro®, without control and without obstacles on an inclined surface
* Number of Videos: 10
* Video List: 5Robots_1 to 5Robots_10
* Format: MKV

# DATA-SPECIFIC INFORMATION FOR: 5DegreeSlopeGlide_10Robots- Ten module collective motion with Velcro®, without control and without obstacles on an inclined surface
* Number of Videos: 10
* Video List: 10Robots_1 to 10Robots_10
* Format: MKV

# DATA-SPECIFIC INFORMATION FOR: 5DegreeSlopeGlide_15Robots- Fifteen module collective motion with Velcro®, without control and without obstacles on an inclined surface
* Number of Videos: 10
* Video List: 15Robots_1 to 15Robots_10
* Format: MKV

# DATA-SPECIFIC INFORMATION FOR: 5DegreeSlopeGlide_20Robots- Twenty module collective motion with Velcro®, without control and without obstacles on an inclined surface
* Number of Videos: 10
* Video List: 20Robots_1 to 20Robots_10
* Format: MKV

# DATA-SPECIFIC INFORMATION FOR: SingleRobotFlat- Ten modules actuated for 180 cycle on a smooth, level surface on each side
* Number of Videos: 20
* Format: MKV and Mp4

# DATA-SPECIFIC INFORMATION FOR: Code - Code and Video for Track Analysis and Code for Undulation Motor Torque Model
* Number of Folders:2
*Format: MATLAB and Python

# DATA-SPECIFIC INFORMATION FOR: 5DegreeSlopeGlide_1Robot- A single robot initialized with orientation from 0° to 315° in 45° increments, facing downward on both side 1 and side 2, gliding without control or obstacles on an inclined surface.
* Number of Videos: 16
* Format: MKV
