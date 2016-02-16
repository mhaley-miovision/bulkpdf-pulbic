RolesSummary = React.createClass({
	mixins: [ReactMeteorData],

	propTypes: {
		objectId: React.PropTypes.string.isRequired,
	},

	getMeteorData() {
		let handle = Meteor.subscribe("roles");

		if (handle.ready()) {
			let roles = RolesCollection.find({email:this.props.objectId}).fetch();
			return { doneLoading: true, roles: roles }
		} else {
			return { doneLoading: false };
		}
	},

	notImplemented() {
		Materialize.toast( "Not implemented yet, stay tuned!", 1000);
	},

	renderRolesControls(r) {
		let controls = [];

		// TODO: implement actually jumping to the role, not the contributor
		var url1 = FlowRouter.path("organizationView", {}, { objectId: r.organization, objectType:"organization"});

		// public controls
		controls.push(
			<a key={r._id+"1"} href={url1} className="secondary-content">
				<i className="material-icons summaryCardIcon grey-text">search</i>
			</a>
		);

		// private controls
		// TODO: check for permissions here

		controls.push(
			<a key={r._id+"2"} onClick={this.notImplemented} className="secondary-content">
				<i className="material-icons summaryCardIcon grey-text">thumb_down</i>
			</a>
		);
		controls.push(
			<a key={r._id+"3"} onClick={this.notImplemented} className="secondary-content">
				<i className="material-icons summaryCardIcon grey-text">thumb_up</i>
			</a>
		);

		return controls;
	},

	renderRoles() {
		if (this.data.doneLoading) {
			return this.data.roles.map(r => {
				return (
					<li className="collection-item" key={r._id}>
						<div className="collection-item-text">
							{r.role}, {r.organization}
						</div>
						{this.renderRolesControls(r)}
					</li>
				);
			});
		}
	},

	render() {
		if (this.data.doneLoading) {
			return (
				<div>
					<ul className="collection with-header">
						<li className="collection-header summaryCardHeader" key={_.escape(this.props.email)+"_roles"}>Roles</li>
						{this.renderRoles()}
					</ul>
				</div>
			);
		} else {
			return <Loading spinner={true}/>
		}
	}
});