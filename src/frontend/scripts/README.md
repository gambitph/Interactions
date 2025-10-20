# Frontend Process

## Runner

The Runner is in charge of orchestrating all the interactions for the frontend.
We have one Runner instance only.

Here's the process that runs on page start:

### 1. All interaction type and action type configurations are fed into the Runner

### 2. All interaction data (the interactions themselves that will run on the page) are configured into the Runner
  - The entire interaction object tree is created based on the data
  - All the initial state styles are computed and added into an inlined style tag
  - All the initial state scripts are gathered

### 3. When the DOM is ready, the Runner initializes all the interactions
  - All the interactions are initialized, all timelines are created
  - All the initial state scripts are run

## Runner Object

- When the configuration object is added, Interaction Objects are created - during this time the DOM is not yet ready

## Interaction Object

- Does not create timelines itself, but provides functions for the interaction configuration to create timelines

