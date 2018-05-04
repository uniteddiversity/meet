import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import { withStyles } from 'material-ui/styles';
import Button from 'material-ui/Button';
import Dialog, {
  DialogActions,
  DialogContent,
  DialogContentText,
} from 'material-ui/Dialog';

const styles = () => ({
});

class IncomingCallDialog extends React.PureComponent {
  render() {
    const {
      record,
      dispatch, // eslint-disable-line
      contacts,
      onAcceptClick,
      onRejectClick,
      ...other
    } = this.props;

    // Base64 URL encoding required, simple conversion here. See
    // https://tools.ietf.org/html/rfc4648#section-5 for the specification.
    const id = record.id.replace(/\+/g, '-').replace(/\//, '_');

    let contactLabel = '';
    const contact = contacts[id];
    if (contact) {
      contactLabel = contact.displayName;
      if (contactLabel === '') {
        contactLabel = contact.userPrincipalName;
      }
    }
    if (contactLabel === '') {
      contactLabel = <em title={record.id}>unknown</em>;
    }

    return (
      <Dialog
        {...other}
      >
        <DialogContent>
          <DialogContentText>
            Incoming call from
          </DialogContentText>
          <DialogContentText>
            {contactLabel}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={onAcceptClick} color="primary" autoFocus>
            Accept
          </Button>
          <Button onClick={onRejectClick} color="secondary">
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    );
  }
}

IncomingCallDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  dispatch: PropTypes.func.isRequired,

  record: PropTypes.object.isRequired,

  contacts: PropTypes.object.isRequired,

  onAcceptClick: PropTypes.func.isRequired,
  onRejectClick: PropTypes.func.isRequired,
};

const mapStateToProps = state => {
  const { table: contacts } = state.contacts;

  return {
    contacts,
  };
};

export default connect(mapStateToProps)(withStyles(styles)(IncomingCallDialog));