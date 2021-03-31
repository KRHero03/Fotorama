import React,{ Component } from "react"
import { withRouter } from 'react-router-dom'
import { Grid, Paper, Typography, Avatar, Dialog, Box, Button, CircularProgress, Tabs, Tab, Card, Tooltip, Zoom,Snackbar,IconButton } from '@material-ui/core'
import { ExitToApp, PersonAdd, PersonAddDisabled,Close } from '@material-ui/icons'
import firebase from 'firebase'
import { Skeleton } from '@material-ui/lab'
import Post from '../../components/Post'
import UserView from '../../components/UserView'
import InfiniteScroll from 'react-infinite-scroll-component'
import MetaTags from 'react-meta-tags'

class Profile extends Component {

  constructor(props) {
    super(props)
    this.state = {
      id: this.props.match.params.id,
      displayName: '',
      photoURL: '',
      followers: [],
      following: [],
      isFollower: true,
      isFollowing: false,
      isLoading: true,
      posts: [],
      isProfilePicModalOpen: false,
      currentUser: null,
      isFollowButtonClicked: false,
      lastTimeStamp: new Date().getTime(),
      tabValue: 0,
      isPostsLoading: true,
      snackbarText: '',
      openSnackbar: false,
    }
  }

  async componentDidMount() {

    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          currentUser: user
        })
      } else {
        this.props.history.push('/')
      }
    })
    const dbRef = firebase.firestore()

    const userRef = dbRef.collection('users').doc(this.state.id)
    const userResult = await userRef.get()
    if (!userResult.exists) {
      this.props.history.push('/')
      return
    }

    const userData = userResult.data()

    this.setState({
      ...this.state,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
    })

    const currentUserID = this.state.currentUser.uid

    if (currentUserID !== this.state.id) {

      const followerRef = dbRef.collection('users').doc(currentUserID).collection('followers').doc(this.state.id)
      const followingRef = dbRef.collection('users').doc(currentUserID).collection('following').doc(this.state.id)

      const followerResult = await followerRef.get()
      const followingResult = await followingRef.get()

      if (followerResult.exists) {
        this.setState({
          ...this.state,
          isFollower: true
        })
      }
      if (followingResult.exists) {
        this.setState({
          ...this.state,
          isFollowing: true,
        })
      }
    }

    const followerResult = await dbRef.collection('users').doc(this.state.id).collection('followers').get()

    let followers = []

    followerResult.docs.forEach((doc) => {
      followers = [...followers, doc.id]
    })
    await this.setState({
      followers: followers
    })

    const followingResult = await dbRef.collection('users').doc(this.state.id).collection('following').get()

    let following = []

    followingResult.docs.forEach((doc) => {
      following = [...following, doc.id]
    })
    await this.setState({
      following: following
    })

    await this.setState({
      ...this.state,
      isLoading: false,
    })


    const postRef = dbRef.collection('posts').where('byID', '==', this.state.id).where('timestamp', '<', this.state.lastTimeStamp).orderBy('timestamp', 'desc').limit(1)
    const postResult = await postRef.get()
    const postRefs = await postResult.docs

    let posts = []
    let ts = 0
    await Promise.all(postRefs.map(async (e) => {
      const id = await e.id
      posts = [...posts, id]
      ts = e.data().timestamp
    }))
    await this.setState({
      ...this.state,
      posts: posts,
      lastTimeStamp: ts,
      isPostsLoading: false
    })
  }


  handleSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    this.setState({
      openSnackbar: !this.state.openSnackbar
    })
  }


  showMessage = (msg) => {
    this.setState({
      snackbarText: msg,
      openSnackbar: true
    })
  }



  loadMorePosts = async () => {
    const db = firebase.firestore()
    const postRef = db.collection('posts').where('byID', '==', this.state.id).where('timestamp', '<', this.state.lastTimeStamp).orderBy('timestamp', 'desc').limit(10)
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

    this.showMessage('Successfully deteled Post!')
  }

  followPerson = async () => {
    this.setState({
      ...this.state,
      isFollowButtonClicked: true
    })

    const dbRef = firebase.firestore()
    const currentUserID = this.state.currentUser.uid
    const followingRef = dbRef.collection('users').doc(currentUserID).collection('following').doc(this.state.id)
    const followerRef = dbRef.collection('users').doc(this.state.id).collection('followers').doc(currentUserID)

    await followingRef.set({
      value: 1
    })
    await followerRef.set({
      value: 1
    })

    this.setState({
      ...this.state,
      isFollowing: true,
      followers: [...this.state.followers, this.state.currentUser.uid],
      isFollowButtonClicked: false
    })

    this.showMessage('Followed '+this.state.displayName)
  }


  unfollowPerson = async () => {
    this.setState({
      ...this.state,
      isFollowButtonClicked: true
    })

    const dbRef = firebase.firestore()
    const currentUserID = this.state.currentUser.uid
    const followingRef = dbRef.collection('users').doc(currentUserID).collection('following').doc(this.state.id)
    const followerRef = dbRef.collection('users').doc(this.state.id).collection('followers').doc(currentUserID)

    await followingRef.delete()
    await followerRef.delete()

    this.setState({
      ...this.state,
      isFollowing: false,
      followers: this.state.followers.filter((e) => e !== this.state.currentUser.uid),
      isFollowButtonClicked: false
    })
    this.showMessage('Unfollowed '+this.state.displayName)
  }

  signOutMethod = async () => {
    await firebase.auth().signOut()
    this.props.history.push('/')
  }

  handleTabChange = (event, value) => {
    this.setState({
      ...this.state,
      tabValue: value
    })
  }

  toggleProfilePicModal = () => {
    this.setState({
      ...this.state,
      isProfilePicModalOpen: !this.state.isProfilePicModalOpen
    })
  }


  render() {
    if (this.state.isLoading)
      return (
        <Grid className='profile'>
          <Grid item xs={12}>
            <Skeleton type='rect' className='profilePlaceholder' />
          </Grid>
        </Grid>
      )
    return (
      <Grid className='profile'>
      <MetaTags>
          <title>{this.state.displayName} | Fotorama</title>
          <meta id="meta-description" name="description" content={"We have "+this.state.displayName+" @Fotorama!"} />
          <meta id="og-title" property="og:title" content={this.state.displayName+" | Fotorama"} />
      </MetaTags>
        <Grid item xs={12}>
          <Paper elevation={0}>
            <Grid className='profileTop'>
              <Box display='flex' justifyContent='center'>
                <Avatar alt={this.state.displayName} src={this.state.photoURL.replace('s96-c', 's500-c')} className='profilePhoto' onClick={this.toggleProfilePicModal} />
              </Box>
              <Box display='flex' justifyContent='center'>
                <Typography variant='h4'>{this.state.displayName}</Typography>
              </Box>
              {
                this.state.id === this.state.currentUser.uid
                  ?
                  <Box display='flex' justifyContent='center' alignItems='center'>
                    <Tooltip TransitionComponent={Zoom} title="Sign Out" aria-label="Sign Out" arrow>
                      <Button onClick={this.signOutMethod} variant="contained" color="secondary">
                        <ExitToApp />Sign Out
                      </Button>
                    </Tooltip>
                  </Box>
                  :
                  <Box display='flex' justifyContent='center' alignItems='center'>
                    {
                      this.state.isFollowButtonClicked
                        ?
                        <CircularProgress color='secondary' />
                        :
                        this.state.isFollowing
                          ?

                          <Tooltip TransitionComponent={Zoom} title="Follow Person" aria-label="Unfollow Person" arrow>
                            <Button onClick={this.unfollowPerson} variant="contained" color="secondary">
                              <PersonAddDisabled />Unfollow
                            </Button>
                          </Tooltip>
                          :
                          <Tooltip TransitionComponent={Zoom} title="Follow Person" aria-label="Follow Person" arrow>
                            <Button onClick={this.followPerson} variant="contained" color="secondary">
                              <PersonAdd />Follow
                            </Button>
                          </Tooltip>
                    }
                  </Box>
              }
              <Tabs
                value={this.state.tabValue}
                onChange={this.handleTabChange}
                indicatorColor="secondary"
                textColor="secondary"
                centered
              >
                <Tab label="Posts" />
                <Tab label="Followers" />
                <Tab label="Following" />
              </Tabs>
            </Grid>

          </Paper>
        </Grid>
        <Grid>
          {
            this.state.tabValue === 0
              ?
              this.state.isPostsLoading
                ?
                <Grid item xs={12} style={{ marginTop: 20 }}>
                  <Skeleton type='rect' className='profilePlaceholder' />
                </Grid>
                :
                this.state.posts.length === 0
                  ?
                  <Card variant='outlined' style={{ marginTop: 20 }}>
                    <Typography style={{ textAlign: 'center' }} variant='h4'> No Posts</Typography>
                  </Card>
                  :
                  <InfiniteScroll
                    dataLength={this.state.posts.length}
                    next={this.loadMorePosts}
                    hasMore={true}
                    refreshFunction={this.loadNewPosts}
                  >
                    {this.state.posts.map((id) => {
                      return (
                        <Grid item xs={12}>
                          <Post key={id} deletePost={this.deletePost} id={id} />
                        </Grid>
                      )
                    })}
                  </InfiniteScroll>
              :
              this.state.tabValue === 1
                ?
                this.state.isLoading
                  ?
                  <Grid item xs={12} style={{ marginTop: 20 }}>
                    <Skeleton type='rect' className='profilePlaceholder' />
                  </Grid>
                  :
                  this.state.followers.length === 0
                    ?
                    <Card variant='outlined' style={{ marginTop: 20 }}>
                      <Typography style={{ textAlign: 'center' }} variant='h4'> No Followers</Typography>
                    </Card>
                    :
                    this.state.followers.map((follower) => {
                      return (
                        <Grid item xs={12}>
                          <UserView id={follower} />
                        </Grid>
                      )
                    })
                :
                this.state.isLoading
                  ?

                  <Grid item xs={12} style={{ marginTop: 20 }}>
                    <Skeleton type='rect' className='profilePlaceholder' />
                  </Grid>
                  :
                  this.state.following.length === 0
                    ?
                    <Card variant='outlined' style={{ marginTop: 20 }}>
                      <Typography style={{ textAlign: 'center' }} variant='h4'> No Following</Typography>
                    </Card>
                    :
                    this.state.following.map((follower) => {
                      return (

                        <Grid item xs={12}>
                          <UserView id={follower} />
                        </Grid>
                      )
                    })
          }
        </Grid>

        <Dialog
          aria-labelledby='Profile Photo Dialog'
          aria-describedby='Profile Photo' onClose={this.toggleProfilePicModal} open={this.state.isProfilePicModalOpen}>
          <img src={this.state.photoURL.replace('s96-c', 's500-c')} alt='Profile' />
        </Dialog>

        <Snackbar
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          open={this.state.openSnackbar}
          autoHideDuration={6000}
          onClose={this.handleSnackbar}
          message={this.state.snackbarText}
          action={
            <React.Fragment>
              <IconButton size="small" aria-label="close" color="inherit" onClick={this.handleSnackbar}>
                <Close fontSize="small" />
              </IconButton>
            </React.Fragment>
          }
        />
      </Grid>
    )
  }

}

export default withRouter(Profile);