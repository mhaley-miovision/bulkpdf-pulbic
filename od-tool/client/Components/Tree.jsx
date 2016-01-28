var chartHeight = 700;
var chartHeightMobile = 303;
var chartWidth = 700;
var chartWidthMobile = 303;

// Topdown card view

var TreeView = (function() {
	var width = screen.width < 700 ? chartWidthMobile : chartWidth;
	var height = screen.width < 700 ? chartHeightMobile : chartHeight;
	var duration = 250;
	var rectW = 120;
	var rectH = 80;
	var nodeMargin = 10;
	var zoomAnchorX = width / 2 - rectW / 2;
	var zoomAnchorY = 20;
	var zoomedNode = null;

	function findNodeByName(startNode, nodeName) {
		if (startNode && nodeName) {
			if (getName(startNode).toLowerCase() === nodeName.toLowerCase()) {
				return startNode;
			}
			if (startNode.children && startNode.children.length > 0) {
				for (var c in startNode.children) {
					var n = findNodeByName(startNode.children[c], nodeName);
					if (n) {
						return n;
					}
				}
			}
		}
		return null;
	}

	var i = 0;

	var tree = d3.layout.tree().nodeSize([rectW + nodeMargin, rectH + nodeMargin]);
	var diagonal = d3.svg.diagonal()
		.projection(function (d) {
			return [d.x + rectW / 2, d.y + rectH / 2];
		});

	var zm = d3.behavior.zoom().scaleExtent([1,3]).on("zoom", redraw);

	var svg;

	function collapse(d) {
		if (d.children) {
			d._children = d.children;
			d._children.forEach(collapse);
			d.children = null;
		}
	}

	function treeNodeNameText(original) {
		if (original.length > 40) {
			return original.substring(0,33) + "...";
		} else {
			return original;
		}
	}

	function htmlForTreeNode(d) {
		var ownersHtmlString = '';
		for (var i in d.owners) {
			ownersHtmlString += '<img class="treeItemProfilePhoto" src="' + d.owners[i].photo + '" title="' + d.owners[i].email + '"/>';
		}

		return '<div class="d3treelabel"><div>' + treeNodeNameText(d.name) + '</div><div>' + ownersHtmlString + '</div>'
			+ '</div>';
	}

	function update(source) {

		// Compute the new tree layout.
		var nodes = tree.nodes(root).reverse(),
			links = tree.links(nodes);

		// Normalize for fixed-depth.
		nodes.forEach(function (d) {
			d.y = d.depth * 180;
		});

		// Update the nodes…
		var node = svg.selectAll("g.node")
			.data(nodes, function (d) {
				return d.id || (d.id = ++i);
			});

		// Enter any new nodes at the parent's previous position.
		var nodeEnter = node.enter().append("g")
			.attr("class", "node")
			.attr("transform", function (d) {
				return "translate(" + source.x0 + "," + source.y0 + ")";
			})
			.on("click", click);

		nodeEnter.append("rect")
			.attr("width", rectW)
			.attr("height", rectH)
			.attr("stroke", "black")
			.attr("stroke-width", 1);

		nodeEnter.append("foreignObject")
			.attr("class", "goalTreeNode")
			.classed("foreign-object", true)
			.attr("width", rectW)
			.attr("height", rectH)
			.append("xhtml:body") 
			.html(htmlForTreeNode);

		// Transition nodes to their new position.
		var nodeUpdate = node.transition()
			.duration(duration)
			.attr("transform", function (d) {
				return "translate(" + d.x + "," + d.y + ")";
			});

		nodeUpdate.select("rect")
			.attr("width", rectW)
			.attr("height", rectH)
			.attr("stroke", "black")
			.attr("stroke-width", 1)
			.style("fill", function (d) {
				return d._children ? "#74AFAD" : "#fff";
			});

		nodeUpdate.select("text")
			.style("fill-opacity", 1);

		// Transition exiting nodes to the parent's new position.
		var nodeExit = node.exit().transition()
			.duration(duration)
			.attr("transform", function (d) {
				return "translate(" + source.x + "," + source.y + ")";
			})
			.remove();

		nodeExit.select("rect")
			.attr("width", rectW)
			.attr("height", rectH)
			//.attr("width", bbox.getBBox().width)""
			//.attr("height", bbox.getBBox().height)
			.attr("stroke", "black")
			.attr("stroke-width", 1);

		nodeExit.select("text");

		// Update the links…
		var link = svg.selectAll("path.link")
			.data(links, function (d) {
				return d.target.id;
			});

		// Enter any new links at the parent's previous position.
		link.enter().insert("path", "g")
			.attr("class", "link")
			.attr("x", rectW / 2)
			.attr("y", rectH / 2)
			.attr("d", function (d) {
				var o = {
					x: source.x0,
					y: source.y0
				};
				return diagonal({
					source: o,
					target: o
				});
			});

		// Transition links to their new position.
		link.transition()
			.duration(duration)
			.attr("d", diagonal);

		// Transition exiting nodes to the parent's new position.
		link.exit().transition()
			.duration(duration)
			.attr("d", function (d) {
				var o = {
					x: source.x,
					y: source.y
				};
				return diagonal({
					source: o,
					target: o
				});
			})
			.remove();

		// Stash the old positions for transition.
		nodes.forEach(function (d) {
			d.x0 = d.x;
			d.y0 = d.y;
		});
	}

	function zoomToNode(source) {
		return;

		if (zoomedNode) {
			console.log("Prev node: ");
			console.log(zoomedNode);
		}

		scale = zm.scale();
		x = source.y0;
		y = -source.x0;


		x = x * scale - width / 2;
		y = y * scale - height / 2;

		console.log(source);
		/*
		console.log("scale: " + scale)
		console.log("source: " + source.x + "," + source.y);
		console.log("source.0: " + source.x0 + "," + source.y0);
		 */
		console.log("new: " + x + "," + y);

		d3.select('g').transition()
			.duration(duration)
			.attr("transform", "translate(" + x + "," + y + ")scale(" + scale + ")");

		zm.scale(scale);
		zm.translate([x, y]);

		zoomedNode = source;
	}

	// Toggle children on click.
	function click(d) {
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		update(d);
		zoomToNode(d);
	}

	// Redraw for zoom
	function redraw() {
		//console.log("here", d3.event.translate, d3.event.scale);
		svg.attr("transform",
			"translate(" + d3.event.translate + ")"
			+ " scale(" + d3.event.scale + ")");
	}

	return {
		loadData: function(data) {
			root = data;

			svg = d3.select(".chartContainer").append("svg").attr("width", width).attr("height", height)
				.call(zm).append("g")
				.attr("transform", "translate(" + zoomAnchorX + "," + zoomAnchorY + ")");

			//necessary so that zoom knows where to zoom and unzoom from
			zm.translate([zoomAnchorX, zoomAnchorY]);

			zoomedNode = root;

			root.x0 = 0;
			root.y0 = height / 2;

			root.children.forEach(collapse);
			update(root);

			d3.select(".chartContainer").style("height", "800px");
		}
	}
})();

Tree = React.createClass({
	mixins: [ReactMeteorData],

	propTypes: {
		org: React.PropTypes.string.isRequired,
		roleMode: React.PropTypes.bool,
	},

	getDefaultProps() {
		return {
			roleMode: true,
			searchVisible: true,
		}
	},

	// TODO: move some of this log into server-side methods
	getMeteorData() {
		var handle = Meteor.subscribe("goals");
		var handle2 = Meteor.subscribe("contributors");
		console.log(handle.ready());
		console.log(handle2.ready());

		var data = {isLoading: !handle.ready() || !handle2.ready()};

		if (!data.isLoading) {

			// TODO: SHOULD OPTIMIZE THESE QUERIES TO USE THE DB MORE RATHER THAN DO THIS CLIENT-SIDE
			let populateGoalChildren = function (o) {
				o.children = [];

				// populate photo urls
				for (var i = 0; i < o.owners.length; i++) {
					// TODO: make this more optimal
					var email = o.owners[i];
					var c = ContributorsCollection.findOne({email: email});
					var url = (c && c.photo) ? c.photo : "img/user_avatar_blank.jpg";
					o.owners[i] = { email: email, photo: url };
				}

				var query = GoalsCollection.find({parent: o._id}); // find the children
				if (query.count() > 0) {
					var r = query.fetch();

					for (var x in r) {

						o.children.push(r[x]); // add the child
						populateGoalChildren(r[x]); // recurse for each child
					}
				}
			}

			// find the root goal
			let rootGoals = GoalsCollection.find({parent: null}).fetch();

			// create a root goal
			let mvRoot = { name: "Miovision Goals", children: [] };

			for (idx in rootGoals) {
				var g = rootGoals[idx];
				mvRoot.children.push(g);
				g.parent = mvRoot;
				populateGoalChildren(g)
			}

			if (mvRoot) {
				data.goals = mvRoot;
				console.log("Tree: ");
				console.log(data.goals);
			} else {
				Materialize.toast("Could not find organization: " + this.props.org, 3000);
				return {};
			}
		}
		return data;
	},

	handleSearch(orgName) {
		TreeView.zoomToNodeByName(orgName);
	},

	updateTreeView() {
		if (!this.data.isLoading) {
			var goals = this.data.goals; // as loaded from the db
			// this is super FUCKED
			// no fucking clue why this has to relinquish control, but it must be react-related, or maybe a bug???
			setTimeout(function () {
				TreeView.loadData(goals);
			}, 0);
		}
	},

	componentWillUpdate(nextProps, nextState) {
		if (nextProps.roleMode != this.props.roleMode) {
			// detected role mode change!
		}
		console.log("componentWillUpdate called!");

		this.updateTreeView();
	},

	shouldComponentUpdate(nextProps, nextState) {
		// let d3 do the updating!
		console.log("shouldComponentUpdate called for component with root: " + this.props.org);

		if (this.props.roleMode != nextProps.roleMode) {
			// update the role vs ic mode
			console.log("detected switch of role vs IC mode!");
		}
		return true;
	},

	componentDidMount() {
		console.log("tree component mounted");

		this.updateTreeView();
	},

	renderLoading() {
		if (this.data.isLoading) {
			return <Loading/>;
		}
	},

	renderSearch() {
		if (this.props.searchVisible) {
			return (
				<div>
					<OrganizationSelector onClick={this.handleSearch} />
				</div>
			);
		}
	},

	render() {
		var divStyle = {
			height: h = screen.width < 700 ? chartHeightMobile : chartHeight,
		};

		return (
			<div className="container">
				{this.renderSearch()}
				{this.renderLoading()}
				<div className="chartContainer" style={divStyle}>
				</div>
				<div className="clear-block"/>
			</div>
		);
	}
});