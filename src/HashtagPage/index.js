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

import { Spin, Statistic, Row, Col, List, Avatar, Divider } from 'antd';

import InfiniteScroll from 'react-infinite-scroller';

import Header from '../Header/index.js';
import FeedCard from '../FeedCard/index.js';

import Api from '../utils/Api';
import { renderPostThumbnail } from '../utils/Utils';

class HashtagPage extends React.Component {
	constructor(props) {
		super(props);
		this.state = this.getInitialState();
	}

	getInitialState = () => {
		return {
			tag: {},
			initiator: null,
			campaignTag: null,
			posts: [],
			popularPosts: [],
			isFirstLoad: true,
			loading: true,
			hasMore: true,
			postIdCursor: null
		};
	};

	componentDidMount() {
		this.loadHashtagData();
	}

	loadHashtagData() {
		this.setState(this.getInitialState(), () => {
			this.getTag();
			this.getTagPosts();
			this.getTagPopularPosts();
		});
	}

	componentDidUpdate(prevProps) {
		const { tag } = this.props.match.params;
		const { tag: previousTag } = prevProps.match.params;
		if (tag !== previousTag) {
			this.loadHashtagData();
		}
	}

	getTag = async () => {
		const { tag } = this.props.match.params;
		const response = await Api.getTag(tag);
		const {
			data: { tag: tagInfo, initiator, campaign_tag: campaignTag }
		} = response;
		this.setState({ loading: false, tag: tagInfo, initiator, campaignTag });
	};

	getTagPosts = async () => {
		const { posts, postIdCursor } = this.state;
		const {
			match: { params },
			setFollowsMap,
			setLikesMap
		} = this.props;
		const { tag } = params;

		const response = await Api.getTagPosts(tag, postIdCursor);
		const { data } = response;
		const { shares } = data;
		const lastPost = shares[shares.length - 1];

		const { id: lastPostId } = lastPost || {};

		if (lastPost) {
			setFollowsMap(extractAccountsFromPosts(shares));
			setLikesMap({ shares });
		}

		this.setState({
			loading: false,
			isFirstLoad: false,
			posts: posts.concat(shares),
			hasMore: shares && shares.length > 0,
			postIdCursor: lastPostId
		});
	};

	getTagPopularPosts = async () => {
		const { tag } = this.props.match.params;
		const response = await Api.getTagPopularPosts(tag);
		this.setState({ popularPosts: response.data.shares });
	};

	onLoadMore = () => {
		this.setState({ loading: true });
		this.getTagPosts();
	};

	renderPopularPosts = () => {
		const { popularPosts } = this.state;

		if (popularPosts.length === 0) {
			return null;
		}

		return (
			<List
				header={<div>Popular</div>}
				grid={{ gutter: 16, column: 3 }}
				dataSource={popularPosts}
				renderItem={item => {
					return <List.Item>{renderPostThumbnail(item)}</List.Item>;
				}}
			/>
		);
	};

	renderTagPosts = () => {
		const { isFirstLoad, loading, hasMore, posts } = this.state;

		const renderHeader = () => {
			if (!loading && posts.length > 0) {
				return <div>Recent Posts</div>;
			}
			return null;
		};

		return (
			<InfiniteScroll
				initialLoad={false}
				pageStart={0}
				loadMore={this.onLoadMore}
				hasMore={!loading && hasMore}
				useWindow={true}
			>
				<List
					header={renderHeader()}
					dataSource={posts}
					loading={loading}
					renderItem={item => <FeedCard key={item.id} post={item} />}
				>
					{loading && !isFirstLoad && hasMore && (
						<div className="loading-container">
							<Spin />
						</div>
					)}
				</List>
			</InfiniteScroll>
		);
	};

	render() {
		const { loading, tag, initiator, campaignTag } = this.state;
		const { user_count, post_count } = tag;
		const { content } = campaignTag || {};

		return (
			<div>
				<Header />

				<div className="App-container">
					<div className="App-content">
						<Spin spinning={loading}>
							<div className="tag-info-header">
								<div className="tag-info-container">
									<span className="tag-name">{tag.value}</span>
									<Row gutter={16} className="stats-row">
										<Col span={12}>
											<Statistic title="Users" value={user_count} />
										</Col>
										<Col span={12}>
											<Statistic title="Posts" value={post_count} />
										</Col>
									</Row>
								</div>
							</div>
						</Spin>

						{campaignTag && (
							<div>
								<a
									href={content.link}
									target="_blank"
									rel="noopener noreferrer"
								>
									<img
										alt=""
										className="campaign-tag-cover"
										src={content.cover}
									/>
								</a>
								<div className="campaign-info-container">
									<Link to={`/user/${initiator.id}`}>
										<Avatar src={initiator.avatar} />
										<span className="campaign-tag-user-nickname">
											{initiator.nickname}
										</span>
									</Link>
									<p className="campaign-tag-description ">
										{content.description}
									</p>
								</div>
								<Divider />
							</div>
						)}

						{this.renderPopularPosts()}

						{this.renderTagPosts()}
					</div>
				</div>
			</div>
		);
	}
}

export default connect(
	null,
	{ setFollowed, setFollowsMap, setLikesMap, extractAccountsFromPosts }
)(HashtagPage);
