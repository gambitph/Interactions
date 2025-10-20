# Locations

All the code here is for providing the options for locations rules and for
matching whether the location rule is satisfied in the frontend.

Each file is for a speficic location rule type e.g. post_status and should be in
charge of listing our what should be the available options in the lcoation rule
selection.

There would be a matching on the PHP side on whether or not the a given rule
satisfies the location.

// TODO: [FSE-SUPPORT] add support for post_archive, is_home, is_blog, is_search, is_404
