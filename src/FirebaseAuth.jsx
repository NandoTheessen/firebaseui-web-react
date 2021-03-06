import React from 'react';

// Global ID for the element.
const ELEMENT_ID = 'firebaseui_container';

// Promise that resolves unless the FirebaseUI instance is currently being deleted.
let firebaseUiDeletion = Promise.resolve();

/**
 * React Component wrapper for the FirebaseUI Auth widget.
 */
export default class FirebaseAuth extends React.Component {
  constructor(props) {
    super(props);

    this.uiConfig = props.uiConfig;
    this.firebaseAuth = props.firebaseAuth;
    this.className = props.className;
    this.uiCallback = props.uiCallback;
    this.unregisterAuthObserver = () => {};
  }

  /**
   * @inheritDoc
   */
  componentDidMount() {
    // Import the css only on the client.
    require('firebaseui/dist/firebaseui.css');

    // Firebase UI only works on the Client. So we're loading the package in `componentDidMount`
    // So that this works when doing server-side rendering.
    const firebaseui = require('firebaseui');

    // Wait in case the firebase UI instance is being deleted.
    // This can happen if you unmount/remount the element quickly.
    return firebaseUiDeletion
      .then(() => {
        // Get or Create a firebaseUI instance.
        this.firebaseUiWidget =
          firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(this.firebaseAuth);
        if (this.uiConfig.signInFlow === 'popup') {
          this.firebaseUiWidget.reset();
        }

        // We track the auth state to reset firebaseUi if the user signs out.
        this.userSignedIn = false;
        this.unregisterAuthObserver = this.firebaseAuth.onAuthStateChanged((user) => {
          if (!user && this.userSignedIn) {
            this.firebaseUiWidget.reset();
          }
          this.userSignedIn = !!user;
        });

        // Trigger the callback if any was set.
        if (this.uiCallback) {
          this.uiCallback(this.firebaseUiWidget);
        }

        // Render the firebaseUi Widget.
        this.firebaseUiWidget.start('#' + ELEMENT_ID, this.uiConfig);
      })
      .catch((e) => console.log('Caught you!'));
  }

  /**
   * @inheritDoc
   */
  componentWillUnmount() {
    firebaseUiDeletion = firebaseUiDeletion
      .then(() => {
        this.unregisterAuthObserver();
        return this.firebaseUiWidget.delete();
      })
      .catch((e) => console.log('Caught you!'));
    return firebaseUiDeletion;
  }

  render() {
    return <div className={this.className} id={ELEMENT_ID} />;
  }
}
