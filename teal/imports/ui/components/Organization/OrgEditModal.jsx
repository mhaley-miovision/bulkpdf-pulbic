import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import Teal from '../../../shared/Teal'

import ControlIconButton from '../ControlButtonIcon.jsx'
import OrgEdit from './OrgEdit.jsx'

export default class OrgEditModal extends Component {
	constructor() {
		super();
		this.handleSave = this.handleSave.bind(this);
		this.handleClose = this.handleClose.bind(this);
	}

	handleSave() {
		let inputs = this.refs.orgEdit.getInputs();
		let changeObject = TealChanges.createChangeObject(
			inputs._id ? TealChanges.Types.UpdateOrganization : TealChanges.Types.NewOrganization,
			Teal.ObjectTypes.Organization,
			"teal.orgs.updateOrInsertOrg", [
				TealFactory.createOrganization(
					inputs._id,
					inputs.name,
					inputs.parentOrg,
					inputs.parentOrgId,
					inputs.startDate,
					inputs.endDate) ]
			, this.props.org);
		Meteor.call("teal.changes.create", changeObject, TealChanges.notifyChangeResult);

		this.refs.orgEdit.clearInputs();
		$('#' + this.props.id).closeModal();
	}
	handleClose() {
		this.refs.orgEdit.clearInputs();
		$('#' + this.props.id).closeModal();
	}

	show() {
		this.refs.orgEdit.clearInputs();
		$('#' + this.props.id).openModal();
	}

	render() {
		return (
			<div id={this.props.id} className="modal modal-fixed-footer">
				<div className="modal-content" style={{padding:0}}>
					<OrgEdit org={this.props.org}
							 parentOrg={this.props.parentOrg}
							 parentOrgId={this.props.parentOrgId}
							 ref="orgEdit"/>
				</div>
				<div className="modal-footer">
					<div className="center">
						<ControlIconButton onClicked={this.handleClose} icon="close"/>
						<ControlIconButton onClicked={this.handleSave} icon="check"/>
					</div>
				</div>
			</div>
		);
	}
}


OrgEditModal.propTypes = {
	org: React.PropTypes.object,
	parentOrg: React.PropTypes.string,
	parentOrgId: React.PropTypes.string,
};
