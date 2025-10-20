# How the Frontend Runner works

We have a frontend.js script that is the main runner of the interactions.

The runner can be configured with interactions and with actions. Then
interactions can be set and started.

For performance, the frontend will only contain the scripts necessary to make
the used interactions run.

All interactions and actions are defined in src/action-types and src/interaction-types, upon building, fontend scripts located in these folders are converted into PHP files so we can dynamically load each them only when used.

# Adding more Interactions & Actions

Add more interactions and actions by adding new PHP entries in src/action-types or src/interaction-types
