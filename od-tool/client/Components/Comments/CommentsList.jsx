CommentsList = React.createClass({
	propTypes: {
		comments: React.PropTypes.array.isRequired,
		showAddInput: React.PropTypes.bool.isRequired,
		objectId: React.PropTypes.string.isRequired,
		objectType: React.PropTypes.string.isRequired,
	},

	initialize() {
		if (this.refs && this.refs.commentsInputBox) {
			this.refs.commentsInputBox.initialize();
		} else {
			console.error("commentsInputBox not mounted yet");
		}
	},

	renderComments() {
		return this.props.comments.map(c => {
			return <CommentItem
				className='CommentItem'
				key={Teal.newId()}
				comment={c}
			/>
		});
	},

	renderInputBox() {
		if (this.props.showAddInput) {
			return <CommentsInputBox key={Teal.newId()} ref="commentsInputBox"
									 objectId={this.props.objectId} objectType={this.props.objectType} />
		}
	},

	render() {
		return (
			<div className="Comments">
				{this.renderInputBox()}
				<div className='CommentsList' style={{ margin: 0 }} key={Teal.newId()}>
					{this.renderComments()}
				</div>
			</div>
		);
	}
});