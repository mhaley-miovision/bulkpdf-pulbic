import { Meteor } from 'meteor/meteor';
import React, { Component } from 'react';
import { createContainer } from 'meteor/react-meteor-data';

import '../third_party/Chart'

import Loading from '../Loading.jsx'

class TeamSkillsSummary extends Component {

	updateChart() {
		if (!this.data.skills || this.data.skills.length <= 0) {
			return;
		}
		let _this = this;

		setTimeout(function () {
			$("#skillsPolarGraph").remove();
			$('#skillsPolarGraphContainer').append('<canvas id="skillsPolarGraph"><canvas>');

			// Get context with jQuery - using jQuery's .get() method.
			let ctx = $("#skillsPolarGraph").get(0).getContext("2d");

			// This will get the first returned node in the jQuery collection.
			let myNewChart = new Chart(ctx);

			let labels = _this.data.skills;
			let data = {
				labels: labels,
				datasets: [],
			};
			for (var email in _this.data.skillRatings) {
				let sr = _this.data.skillRatings[email];

				// put skills in same order as labels for this user
				let skillsData = [];
				for (var i = 0; i < labels.length; i++) {
					skillsData.push(sr[labels[i]]);
				}
				data.datasets.push({
					label: email.split('@')[0],
					fillColor: "rgba(220,220,220,0.2)",
					strokeColor: "rgba(220,220,220,1)",
					pointColor: "rgba(220,220,220,1)",
					pointStrokeColor: "#fff",
					pointHighlightFill: "#fff",
					pointHighlightStroke: "rgba(220,220,220,1)",
					data: skillsData
				});
			};
			ctx.canvas.width = 400;
			ctx.canvas.height = 400;
			var c = new Chart(ctx).Radar(data, Chart.defaults.Radar );

		}, 10);
	}

	componentDidUpdate(nextProps, nextState) {
		if (this.props.doneLoading && this.props.skills) {
			this.updateChart();
		}
	}

	renderCanvas() {
		if (this.props.skills && this.props.skills.length > 0) {
			return (
				<div id="skillsPolarGraphContainer">
					<canvas id="skillsPolarGraph" width="175px" height="175px" className="skillsPolarGraph"></canvas>
				</div>
			);
		} else {
			return (
				<div className="grey-text">
					<p style={{textAlign:"center"}}>
						This organization has no skills defined yet.
					</p>
				</div>
			);
		}
	}

	render() {
		if (this.props.doneLoading) {
			return (
				<div>
					<ul className="collection with-header">
						<li className="collection-header summaryCardHeader">Skills</li>
						{this.renderCanvas()}
					</ul>
				</div>
			);
		} else {
			return <Loading spinner={true}/>
		}
	}
}

TeamSkillsSummary.propTypes = {
	orgId: React.PropTypes.string.isRequired,
};

export default createContainer(() => {
	"use strict";

	let handle = Meteor.subscribe("teal.roles");
	let handle2 = Meteor.subscribe("teal.skills");
	let handle3 = Meteor.subscribe("teal.organizations");

	if (handle.ready() && handle2.ready() && handle3.ready()) {
		// get unique user emails
		let users = _.uniq(RolesCollection.find({_id:this.props.orgId}, {email: 1}).fetch().map(function(x) {
			return x.email;
		}), true);

		// get skills, and ensure skills must be alpha sorted
		var skills = [];
		var skillRatings = {};
		SkillsCollection.find({email: { $in: users }}, {sort: { skill: 1 }}).fetch().forEach(function(x) {
			if (!skillRatings[x.email]) {
				skillRatings[x.email] = {};
			}
			skillRatings[x.email][x.skill] = x.rating;
			skills.push(x.skill); // just keep track of all skills
		});
		skills = _.uniq(skills);
		skills.sort();

		this.data = { skills: skills, skillRatings: skillRatings, doneLoading: true }

		if (skills.length > 0) {
			this.updateChart();
		}
		return this.data;
	} else {
		return { doneLoading: false };
	}
}, TeamSkillsSummary);
