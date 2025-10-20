# We have renamed WP Interactions to just Interactions

This contains names, variables, handles, constants, etc that we've changed:

1. PHP Constants 

WPINTERACTIONS_BUILD -> INTERACT_BUILD
WPINTERACTIONS_VERSION -> INTERACT_VERSION
WPINTERACTIONS_FILE -> INTERACT_FILE

look for exact matches in .php files

2. PHP & JS Hooks

search and replace regex:

`((action|filter|filters)\(\s?['"])wpi([.\/_])`

replace with:

`$1interact$3`

3. Script & style handles:

search & replace regex:

`((style|script)\(\t*\n*\s*['"])wpi(-)`

replace with:

`$1interact$3`

4. Rest API endpoints:

search & replace:

`wpi/v1`

replace with:

`interact/v1`

5. PHP classes:

search & replace regex (case sensitive):

`WPI_([A-Z][a-z])`

replace with:

`Interact_$1`

6. PHP function names:

search & replace regex (case sensitive):
`wpi_([^\(]+\()`
replace with:
`interact_$1`

and

`(\(\s*['"])wpi_`
replace with:
`$1interact_`

and manually adjust some function names, search for "wpi"

7. PHP variables:

search & replace regex (case sensitive):

`\$wpi_`

replace with:

`$interact_`

8. Adjust JS alias

search & replace:

`~wpi`

replace with:

`~interact`

9. Rename openWPISidebar, do this manually

10. WPIRunner and other JS classes

search & replace regex (case sensitive):

`WPI(\w)`

replace with:

`Interact$1`

11. JS events

search & replace regex (case sensitive):

`([^\w])wpi/`

replace with:

`$1interact/`