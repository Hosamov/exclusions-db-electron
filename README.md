# exclusions-db
An exclusions database that is web-based using Node, express and MongoDB/Mongoose

# Routes
## GET Routes:
- / - root, redirects to /login or /home, depending on authentication status
- /login - renders the login page
- /register - renders the register page, accessible only by Admin for adding new users.
- /unauthorized - basic 'unauthorized' template, contains link to go back to / route.
- /home - renders the exclusions page, displaying all ACTIVE exclusion orders
  - Displays all exclusions, which will be clickable to expand basic data.
    Further clickable to display the whole exclusion order (for print)
  - Button/link for add new exclusion (/add_new_eclusion) (Admin or supervisor only)
  - Link on each card (in exlcusions list) to "edit" (Admin or Supervisor only)
  - Link to archive old/outdated exclusions, or those with a reprieve
  - FEATURE: Sortable based on exclusion length, most recent, or by name
- /add_new_exclusion - renders add new exclusion page
  - Name - input
  - DOB - input
  - Other info (i.e. gender, height, hair color, etc.) - input
  - Description (what happened, RCW/policy violated) - text area
  - Length of exclusion (3, 7, 14, 30, 60, 180, 365, Lifetime, Other) - dropdown box
    - Other - input
  - Image upload
  - Button to save the data
- /edit_exclusion - renders page to edit an exclusion
- /archive_exclusion - renders page with a text area for explaining why the
  active exclusion is being archived.
- /past_orders - renders list of individuals who have previously been served an
  exclusion order, with the violations.

## POST Routes:
- /login
- /register (accessibly only by admin)
- /add_exclusion
- /edit_exclusion
- /archive_exclusion