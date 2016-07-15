# HAuthDialog

UI for authentication through h-auth.

It does not use Polymer nor any front-end framework as it is intended
to be used in multiple environments.

One specific env comes to mind: the inspector script that is injected into
h-dev project server. In that environment, the component should be as least
intrusive as possible in order not to interfere with the user's application.

Thus, Polymer is not used. Probably a Polymer standalone version of this 
component should be developed as well. But that will be for the future.
