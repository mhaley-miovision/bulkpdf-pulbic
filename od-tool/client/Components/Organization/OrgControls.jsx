OrgControls = React.createClass({
	propTypes: {
		org : React.PropTypes.object.isRequired,
		/*
		isEditing: React.PropTypes.bool.isRequired,
		onEditClicked: React.PropTypes.func.isRequired,
		onSaveClicked: React.PropTypes.func.isRequired,
		onCancelClicked: React.PropTypes.func.isRequired,
		onDeleteClicked: React.PropTypes.func.isRequired,
		newModalId: React.PropTypes.string.isRequired,
		subGoalsModalId: React.PropTypes.string.isRequired,
		*/
	},

	getInitialState() {
		return {
			subGoalsModalVisible: false,
			subGoalsTargetId: null,
		};
	},

	showNewGoalModal() {
		// TODO: move this to a method on the component
		$('#' + this.props.newModalId).openModal();
	},
	showSubgGoalsModal() {
		// TODO: move this to a method on the component
		$('#' + this.props.subGoalsModalId).openModal();
	},
	tipId() {
		return "ct_" + this.props.org._id;
	},

	notImplemented() {
		Materialize.toast("Not implemented yet",1000);
	},

	handleNewRole() {
		this.refs.orgNewRoleModal.show();
	},
	handleRemoveOrg() {
		console.log(this.props.org);

		let changeObject = TealChanges.createChangeObject(
			TealChanges.Types.RemoveOrganization, Teal.ObjectTypes.Organization,
			"teal.orgs.removeOrganization", [ this.props.org._id ], this.props.org);
		Meteor.call("teal.changes.create", changeObject, TealChanges.notifyChangeResult);
	},
	handleAddOrg() {
		this.refs.orgNewOrgModal.show();
	},
	handleEditOrg() {
		this.refs.orgEditOrgModal.show();
	},
	handleCommentsClicked(evt) {
		if (evt) {
			console.log(evt);
			evt.preventDefault();
			evt.stopPropagation();
		}

		if (this.refs && this.refs.commentsModal) {
			this.refs.commentsModal.show();
		} else {
			console.error("commentsModal not mounted yet");
		}
	},

	render() {
		return (
			<div>
				<RoleEditModal id="orgNewRoleModal" ref="orgNewRoleModal"
							   organization={this.props.org.name} organizationId={this.props.org._id}/>
				<OrgEditModal id="orgNewOrgModal" ref="orgNewOrgModal"
							  parentOrg={this.props.org.name} parentOrgId={this.props.org._id}/>
				<OrgEditModal id="orgEditOrgModal" ref="orgEditOrgModal" org={this.props.org}/>
				<CommentsModal ref="commentsModal"
							   comments={this.props.org.comments ? this.props.org.comments : []}
							   objectId={this.props.org._id}
							   objectType={Teal.ObjectTypes.Organization}/>

				<div className="center">
					<ControlIconButton onClicked={this.handleRemoveOrg} icon="delete" tip="Remove organization" tipId={this.tipId()}/>
					<ControlIconButton onClicked={this.handleNewRole} icon="add" tip="Add role" tipId={this.tipId()}/>
					<ControlIconButton onClicked={this.handleAddOrg} icon="add_circle_outline" tip="Add organization" tipId={this.tipId()}/>
					<ControlIconButton onClicked={this.handleEditOrg} icon="edit" tip="Edit organization" tipId={this.tipId()}/>
					<ControlIconButton onClicked={this.handleCommentsClicked}
									   countBadgeValue={this.props.org.comments && this.props.org.comments.length > 0 ?
														 this.props.org.comments.length : null}
									   icon="comment" tip="Comments" tipId={this.tipId()}/>
					<ReactTooltip id={this.tipId()} place="bottom"/>
				</div>`
			</div>
		);
	}
});