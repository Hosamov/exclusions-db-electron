# exclusions-db

An exclusions database that is web-based using Node, express and MongoDB/Mongoose


# Site Members

### Admin
- Admins have complete access to the entire system, with full control in order to create, edit,
  and delete exclusion orders, as well as authorize, edit, and delete all other individual
  users.

### Supervisor
- Supervisors have the ability to create, read, edit, and delete exclusion
  orders. Users may access their private account to change password.

### User
- User is the most basic class of site member, having the ability to view and
  print exclusion orders. Users may access their private account to change password.

# Routes

## GET Routes:

### Routine GET Routes
- / - root, redirects to /login or /home, depending on authentication status
- /login - renders the login page
- /retry_login - A redirect page for unsuccessful login attempts.
- /register - renders the register page, accessible only by Admin for adding new users.
- /unauthorized - basic 'unauthorized' template, contains link to go back to / route.

### Exclusions GET Routes
- /home - renders the exclusions page, displaying all ACTIVE exclusion orders
  - Displays all exclusions, which will be clickable to expand basic data.
    Further clickable to display the whole exclusion order (for print)
  - Button/link for add new exclusion (/add_new_eclusion) (Admin or supervisor only)
  - Link on each card (in exlcusions list) to "edit" (Admin or Supervisor only)
  - Link to archive old/outdated exclusions, or those with a reprieve
  - FEATURE: Sortable based on exclusion length, most recent, or by name
- /add_new_exclusion - renders add new exclusion template (only exclusion page
  outside the /home path)
  - Name - input
  - DOB - input
  - Other info (i.e. gender, height, hair color, etc.) - input
  - Description (what happened, RCW/policy violated) - text area
  - Length of exclusion (3, 7, 14, 30, 60, 180, 365, Lifetime, Other) - dropdown box
    - Other - input
  - Image upload
  - Served Date
  - Expiration Date (optional)
  - Button to save the data
- /home/:exclusion/edit - renders page to edit an exclusion
- /home/:exclusion/delete - renders delete confirmation page for deleting an
  exclusion order. Accessible by Admin user.
- /home/:exclusion/archive - renders page with a text area for explaining why the
  active exclusion is being archived.
- /home/archive - renders list of individuals who have previously been served an
  exclusion order, with the violations.

### Users GET Routes
- /users - Renders a list of all active users. Accessible by admin
- /users/:user - Renders individual user page for selected user.
- /users/:user/edit_user - Renders edit page for individual/selected user. Accessible by individual/logged
  in user to change own account's password/info. Also accessible by admin -
  editing roles, activating account, resetting password, etc...
- /users/:user/delete_user - After confirmation in /users/:user/confirm_delete,
  Redirects to /users route. 
- /users/:user/confirm_delete - Renders page to confirm deletion of selected
  user. Redirects to /users/:user/delete_user route.

## POST Routes:

- /login
- /register (accessibly only by admin)
- /edit_user
- /add_exclusion
- /edit_exclusion
- /archive_exclusion

## TODOS:

- DONE » Setup CAPTCHA for /login and /register routes
- DONE » Setup '/edit_user' GET and POST routes
- DONE » Setup system for resetting user password
- DONE » Setup email system for new logins and user edits
- DONE » In /home route, render each exclusion with a hyperlink, linking to
  /home/[exclusion _id], which will display the entire exclusion.
- DONE » Setup '/home/:exclusion/edit' GET and POST routes
- DONE » Setup '/home/:exclusion/delete' GET route
- Setup '/archive' GET route - displays list of all past exclusion orders
  by name
- Setup '/archive/:exclusion_id' GET route - displays the archived exclusion
  order selected by the user. (only admins can delete these)

### Created: 11/29/2022; Last edited 12/16/2022
