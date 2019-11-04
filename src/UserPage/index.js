import React from 'react';
import './style.scss';

import {
	setFollowed,
	setFollowsMap,
	setLikesMap,
	extractAccountsFromPosts
} from '../HomePage/homeActions';

import { Link } from 'react-router-dom';
import { connect } from 'react-redux';

import { Spin, Statistic, Row, Col, List } from 'antd';

import Header from '../Header/index.js';
import UserAvatar from '../UserAvatar/index.js';
import FeedCard from '../FeedCard/index.js';
import UserListModal from '../UserListModal/index.js';

import Api from '../utils/Api';
import FollowButton from '../FollowButton';

class UserPage extends React.Component {
	state = {
		user: {},
		posts: [],
		loading: true,
		popularPosts: [],
		isUserListModalOpen: false,
		userListType: null
	};

	componentDidMount() {
		this.loadUserData();
	}

	loadUserData() {
		this.setState({ loading: true });
		this.getUser();
		this.getUserPosts();
		this.getUserPopularPosts();
	}

	componentDidUpdate(prevProps) {
		const { userId } = this.props.match.params;
		const { userId: previousUserId } = prevProps.match.params;
		if (userId !== previousUserId) {
			this.loadUserData();
		}
	}

	getUser = async () => {
		const {
			match: { params },
			setFollowed
		} = this.props;
		const { userId } = params;

		const response = await Api.getUser(userId);

		const { data: user } = response;
		const { account } = user;
		const { followed } = account;

		setFollowed(userId, followed);

		this.setState({ loading: false, user });
	};

	getUserPosts = async () => {
		const {
			match: { params },
			setFollowsMap,
			setLikesMap
		} = this.props;
		const { userId } = params;

		const response = await Api.getUserPosts(userId, 1);
		const { data } = response;
		const { list: posts } = data;

		setFollowsMap(extractAccountsFromPosts(posts));
		setLikesMap({ shares: posts });

		this.setState({ posts });
	};

	getUserPopularPosts = async () => {
		const {
			match: { params },
			setFollowsMap
		} = this.props;
		const { userId } = params;

		const response = await Api.getUserPopularPosts(userId);
		const { data } = response;
		const { list: popularPosts } = data;

		setFollowsMap(extractAccountsFromPosts(popularPosts));

		this.setState({ popularPosts });
	};

	showUserListModal = type => {
		this.setState({ isUserListModalOpen: true, userListType: type });
	};

	closeUserListModal = () => {
		this.setState({ isUserListModalOpen: false });
	};

	render() {
		const {
			loading,
			user,
			posts,
			popularPosts,
			isUserListModalOpen,
			userListType
		} = this.state;
		const { account = {}, counts = {} } = user;
		const { id: userId, avatar, nickname, description } = account;
		const { follower, follows, got_like, like, public_post } = counts;

		return (
			<div>
				<Header />

				<div className="App-container">
					<div className="App-content">
						<Spin spinning={loading}>
							<div className="user-info-header">
								<UserAvatar size={64} src={avatar} className="user-avatar" />

								<div className="user-info-container">
									<div className="user-nickname-row">
										<div className="user-nickname-container">
											<span className="user-nickname">{nickname}</span>
											<span>{got_like} likes</span>
										</div>
										<FollowButton userId={userId} />
									</div>

									<Row gutter={16} className="stats-row">
										<Col span={6}>
											<Statistic title="Posts" value={public_post} />
										</Col>
										<Col
											span={6}
											onClick={() => this.showUserListModal('following')}
										>
											<Statistic
												className="clickable"
												title="Following"
												value={follows}
											/>
										</Col>
										<Col
											span={6}
											onClick={() => this.showUserListModal('followers')}
										>
											<Statistic
												className="clickable"
												title="Followers"
												value={follower}
											/>
										</Col>
										<Col span={6}>
											<Link to={`/user/${userId}/liked`}>
												<Statistic title="Liked" value={like} />
											</Link>
										</Col>
									</Row>
									<p>{description}</p>
								</div>
							</div>
						</Spin>

						<List
							grid={{
								gutter: 16,
								xs: 1,
								sm: 2,
								md: 3,
								lg: 3,
								xl: 3,
								xxl: 3
							}}
							dataSource={popularPosts}
							renderItem={item => {
								const { id: postId } = item;
								const { app_thumb } = item;

								return (
									<List.Item>
										<Link to={`/post/${postId}`}>
											<img
												alt=""
												src={app_thumb}
												className="popular-post-thumbnail"
											/>
										</Link>
									</List.Item>
								);
							}}
						/>

						{posts.map(post => (
							<FeedCard post={post} />
						))}
					</div>
				</div>
				{isUserListModalOpen && (
					<UserListModal
						title={userListType === 'followers' ? 'Followers' : 'Following'}
						type={userListType}
						userId={userId}
						onClose={this.closeUserListModal}
					/>
				)}
			</div>
		);
	}
}

export default connect(
	null,
	{ setFollowed, setFollowsMap, setLikesMap, extractAccountsFromPosts }
)(UserPage);
