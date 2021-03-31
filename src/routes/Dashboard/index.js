import { Component } from "react"
import { withRouter } from 'react-router-dom'
import { Grid } from '@material-ui/core'
import firebase from 'firebase'
import { Skeleton } from '@material-ui/lab'
import CreatePost from '../../components/CreatePost'
import Post from '../../components/Post'
import InfiniteScroll from 'react-infinite-scroll-component'
import index from '../../config/algoliaConfig'
import MetaTags from 'react-meta-tags'


class Dashboard extends Component {

  constructor(props) {
    super(props)
    this.state = {
      user: null,
      isAuthenticated: false,
      posts: [],
      isUserDataLoading: true,
      isPostsLoading: true,
      lastTimeStamp: new Date().getTime(),
      hasMore: true,

    }
  }
  async componentDidMount() {

    firebase.auth().onAuthStateChanged(async (user) => {
      if (user) {

        const db = firebase.firestore()
        const ref = db.collection('users').doc(user.uid)
        const result = await ref.get()
        if (!result.exists) {
          await index.saveObjects([{ objectID: user.uid, displayName: 'Krunal Rank', uid: user.uid }])
          await ref.set({
            displayName: user.displayName,
            photoURL: user.photoURL,
            followers: [],
            following: [],
          })
        }
        this.setState({
          user: user,
          isUserDataLoading: false,
          isAuthenticated: true
        })
      } else {
        this.props.history.push('/')
      }
      return
    })


    const dbRef = firebase.firestore()

    const postRef = dbRef.collection('posts').orderBy('timestamp', 'desc').limit(1)
    const postResult = await postRef.get()
    const postRefs = await postResult.docs

    let posts = []
    let ts = 0
    await Promise.all(postRefs.map(async (e) => {
      const id = await e.id
      posts = [...posts, id]
      ts = e.data().timestamp
    }))
    this.setState({
      ...this.state,
      posts: posts,
      lastTimeStamp: ts,
      isPostsLoading: false,
    })
  }

  loadNewPosts = async () => {
    await this.setState({
      lastTimeStamp: new Date().getTime(),
      posts: [],
    })
    const db = firebase.firestore()
    const postRef = db.collection('posts').where('timestamp', '<', this.state.lastTimeStamp).orderBy('timestamp', 'desc').limit(10)
    const postResult = await postRef.get()
    const postRefs = await postResult.docs

    if (postRefs.length === 0) {
      await this.setState({
        hasMore: false,
      })
      return
    }
    let posts = []
    let ts = 0
    await Promise.all(postRefs.map(async (e) => {
      const id = await e.id
      posts = [...posts, id]
      ts = e.data().timestamp
    }))

    this.setState({
      ...this.state,
      posts: posts,
      lastTimeStamp: ts
    })
  }
  loadMorePosts = async () => {
    if (this.state.isPostsLoading) return
    const db = firebase.firestore()
    const postRef = db.collection('posts').where('timestamp', '<', this.state.lastTimeStamp).orderBy('timestamp', 'desc').limit(10)
    const postResult = await postRef.get()
    const postRefs = await postResult.docs

    let posts = []
    let ts = 0
    await Promise.all(postRefs.map(async (e) => {
      const id = await e.id
      posts = [...posts, id]
      ts = e.data().timestamp
    }))

    this.setState({
      ...this.state,
      posts: [...this.state.posts, ...posts],
      lastTimeStamp: ts
    })

  }

  deletePost = async (id) => {
    if (this.state.isPostsLoading) return
    const dbRef = firebase.firestore()
    const postRef = dbRef.collection('posts').doc(id)
    const postResult = await postRef.get()
    const postData = postResult.data()
    this.setState({
      ...this.state,
      posts: this.state.posts.filter((e) => e !== id)
    })

    await Promise.all(postData.tags.map(async (tag) => {
      const tagRef = dbRef.collection('tags').doc(tag)
      const tagResult = await tagRef.get()
      const tagData = await tagResult.data()
      await tagRef.set({
        posts: tagData.posts.filter((e) => e !== id)
      })
    }))
    await postRef.delete()
  }

  render() {
    return (
      <Grid className='dashboard'>
        <MetaTags>
          <title>Feed | Fotorama</title>
          <meta id="meta-description" name="description" content="Fotorama Feed" />
          <meta id="og-title" property="og:title" content="Fotorama" />
        </MetaTags>
        <Grid item xs={12}>
          {
            this.state.isUserDataLoading ?
              <Skeleton variant="rect" className='dashboardCreatePostPlaceholder' />
              :
              <CreatePost user={this.state.user} />
          }
        </Grid>
        <InfiniteScroll
          dataLength={this.state.posts.length}
          next={this.loadMorePosts}
          hasMore={true}
          refreshFunction={this.loadNewPosts}
          pullDownToRefresh
          pullDownToRefreshThreshold={50}
          pullDownToRefreshContent={
            <h3 style={{ textAlign: 'center' }}>&#8595; Pull down to refresh</h3>
          }
          releaseToRefreshContent={
            <h3 style={{ textAlign: 'center' }}>&#8593; Release to refresh</h3>
          }
        >
          {this.state.posts.map((id) => {
            return (
              <Grid item xs={12}>
                <Post key={id} deletePost={this.deletePost} id={id} />
              </Grid>
            )
          })}
        </InfiniteScroll>
      </Grid>
    )
  }

}

export default withRouter(Dashboard);