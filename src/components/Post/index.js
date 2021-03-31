import { Skeleton } from "@material-ui/lab"
import { Component } from "react"
import { Card, CardActions, CardHeader, Avatar, IconButton, CardContent, Dialog, Paper, CircularProgress, Tooltip, Zoom, Box, Menu, MenuItem, Link, Typography } from '@material-ui/core'
import { MoreVert, Favorite, Delete, GetApp } from '@material-ui/icons'
import { withRouter } from 'react-router-dom'
import firebase from 'firebase'

class Post extends Component {
  _isMounted = false;
  constructor(props) {
    super(props)
    this.state = {
      postID: this.props.id,
      byID: '',
      byAvatar: '',
      byDisplayName: '',
      isLoading: true,
      imageUrl: '',
      user: null,
      postContent: '',
      likes: [],
      timestamp: '',
      downloads: 0,
      isLiked: false,
      tags: [],
      deleted: false,
      isProfilePicModalOpen: false,
      isPhotoModalOpen: false,
      isLiking: false,
      isDownloading: false,
      menuAnchorEl: null,
    }
  }

  async componentDidMount() {
    this._isMounted = true
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          user: user
        })
      } else {
        this.props.history.push('/')
      }
    })

    const dbRef = firebase.firestore()

    const postRef = dbRef.collection('posts').doc(this.state.postID)

    const result = await postRef.get()

    if (!result.exists) {
      this.setState({
        deleted: true
      })
      return
    }
    const data = await result.data()
    await this.setState({
      byID: data.byID,
      imageUrl: data.imageUrl,
      postContent: data.postContent,
      likes: data.likes,
      timestamp: data.timestamp,
      downloads: data.downloads,
      tags: data.tags,
    })
    if (this.state.likes.includes(this.state.user.uid)) {
      this.setState({
        isLiked: true
      })
    }
    const userRef = dbRef.collection('users').doc(this.state.byID)

    const userResult = await userRef.get()
    if (!userResult.exists) {
      this.setState({
        deleted: true
      })
      return
    }
    const userData = await userResult.data()
    this.setState({
      byDisplayName: userData.displayName,
      byAvatar: userData.photoURL,
      isLoading: false,
    })

  }


  toggleLike = async () => {
    this.setState({
      isLiking: true,
    })
    const dbRef = firebase.firestore()
    const postRef = dbRef.collection('posts').doc(this.state.postID)
    const postResult = await postRef.get()
    if (!postResult.exists) {
      this.setState({
        deleted: true,
      })
      return
    }
    const postData = await postResult.data()


    if (this.state.isLiked) {
      await postRef.set({
        likes: postData.likes.filter((e) => e !== this.state.user.uid)
      }, { merge: true })

      this.setState({
        ...this.state,
        likes: postData.likes.filter((e) => e !== this.state.user.uid)
      })

      this.setState({
        isLiked: false
      })
    } else {
      await postRef.set({
        likes: [...postData.likes, this.state.user.uid]
      }, { merge: true })

      this.setState({
        ...this.state,
        likes: [...postData.likes, this.state.user.uid]
      })

      await Promise.all(this.state.tags.map(async tag => {
        const userTagRef = dbRef.collection('users').doc(this.state.user.uid).collection('likedTags').doc(tag)
        const userTagResult = await userTagRef.get()
        const userTagData = await userTagResult.data()
        if (!userTagResult.exists) {
          await userTagRef.set({
            value: 1
          })
          return
        }
        await userTagRef.set({
          value: userTagData.value + 1
        })
      }))

      this.setState({
        isLiked: true
      })

    } this.setState({
      isLiking: false,
    })
  }

  downloadImage = async () => {
    this.setState({
      isDownloading: true
    })
    const dbRef = firebase.firestore()
    const postRef = dbRef.collection('posts').doc(this.state.postID)
    const postResult = await postRef.get()
    if (!postResult.exists) {
      this.props.history.push('/')
      return
    }
    const postData = await postResult.data()

    await postRef.set({
      downloads: postData.downloads + 1
    }, { merge: true })

    var url = this.state.imageUrl.replace(/^data:image\/[^;]+/, 'data:application/octet-stream')
    window.open(url)

    this.setState({
      isDownloading: false
    })
  }

  togglePhotoModal = () => {
    this.setState({
      ...this.state,
      isPhotoModalOpen: !this.state.isPhotoModalOpen,
    })
  }

  toggleProfilePicModal = () => {
    this.setState({
      ...this.state,
      isProfilePicModalOpen: !this.state.isProfilePicModalOpen,
    })
  }

  handleMenuOpen = (e) => {
    this.setState({
      ...this.state,
      menuAnchorEl: e.currentTarget
    })
  }

  handleMenuClose = () => {
    this.setState({
      ...this.state,
      menuAnchorEl: null
    })
  }

  getTime = (timestamp) => {
    if (this.state.isLoading) return ''
    let d = timestamp
    let currentTime = new Date().getTime()

    const monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    const min = 60 * 1000
    const hour = 60 * min
    if (currentTime - d <= 15 * min) return 'Few mins ago'
    else if (currentTime - d <= 30 * min) return 'Half hour ago'
    else if (currentTime - d <= hour) return 'An hour ago'
    else if (currentTime - d <= 2 * hour) return '2 hours ago'
    else if (currentTime - d <= 4 * hour) return '4 hours ago'
    else if (currentTime - d <= 8 * hour) return '8 hours ago'
    else if (currentTime - d <= 12 * hour) return '12 hours ago'
    else if (currentTime - d <= 24 * hour) return 'A day ago'

    d = new Date(d)
    return monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear()

  }

  render() {
    if (this.state.isLoading)
      return <Skeleton type='rect' className='postPlaceholder' />
    if (this.state.deleted) {
      return (<Paper elevation={0} className='postPaper'>
        <Card variant='outlined' className='createPostCard'>
          <CardContent>
            This post has been deleted by the user or the user closed his/her Fotorama Account or has been taken down due to violation of one or more Polcies under Fotorama Healthy Post Guidelines.
          </CardContent>
        </Card>
      </Paper>)
    }
    return (
      <Paper elevation={0} className='postPaper'>
        <Card variant='outlined' className='createPostCard'>
          <CardHeader
            avatar={
              <Tooltip TransitionComponent={Zoom} title="Open Avatar" aria-label="Open Avatar" arrow>
                <Avatar alt={this.state.byDisplayName} src={this.state.byAvatar.replace('s96-c', 's500-c')} onClick={this.toggleProfilePicModal} />
              </Tooltip>
            }
            action={
              this.state.user.uid === this.state.byID ?
                <IconButton aria-label="settings" onClick={this.handleMenuOpen}>
                  <MoreVert />
                </IconButton>
                :
                null
            }
            title={
              <Tooltip TransitionComponent={Zoom} title="Open Profile" aria-label="Open Profile" arrow>
                <Link color='textPrimary' href={'/profile/' + this.state.byID}>
                  {this.state.byDisplayName}
                </Link>
              </Tooltip>
            }
            subheader={this.getTime(this.state.timestamp)}
          />
          <CardContent>
            {this.state.postContent.split('\n').map((e) => { return <p>{e}</p> })}
          </CardContent>
          {
            this.state.imageUrl.length !== 0
              ?
              <div>
                <img alt='Upload'
                  className='createPostCardImage'
                  src={this.state.imageUrl} onClick={this.togglePhotoModal}
                />
              </div>

              :
              null

          }
          <CardActions disableSpacing>
            {
              this.state.isLiking
                ?
                <CircularProgress color='secondary' />
                :
                <Box display='flex' alignItems='center'>
                  <Tooltip TransitionComponent={Zoom} title="Like Post" aria-label="Like Photo" arrow>
                    <IconButton aria-label="Like Post" onClick={this.toggleLike} color={this.state.isLiked ? 'secondary' : 'default'}>
                      <Favorite />
                    </IconButton>
                  </Tooltip>
                  {this.state.likes.length}
                </Box>
            }
            {
              this.state.isDownloading
                ?
                <CircularProgress color='secondary' />
                :
                <Box display='flex' alignItems='center' style={{ marginLeft: 20 }}>

                  <Tooltip TransitionComponent={Zoom} title="Download Image" aria-label="Download Image" arrow>
                    <IconButton aria-label="Download Image" onClick={this.downloadImage} >
                      <GetApp />
                    </IconButton>
                  </Tooltip>
                  {this.state.downloads}
                </Box>
            }
          </CardActions>
        </Card>

        <Dialog className='dialog'
          aria-labelledby='Profile Photo Dialog'
          aria-describedby='Profile Photo' onClose={this.toggleProfilePicModal} open={this.state.isProfilePicModalOpen}>
          <img src={this.state.byAvatar.replace('s96-c', 's500-c')} alt='Profile' />
        </Dialog>
        <Dialog className='dialog'
          aria-labelledby='Photo Dialog'
          aria-describedby='Photo' onClose={this.togglePhotoModal} open={this.state.isPhotoModalOpen}>
          <img src={this.state.imageUrl} alt='Upload' />
        </Dialog>
        <Menu
          anchorEl={this.state.menuAnchorEl}
          keepMounted
          open={Boolean(this.state.menuAnchorEl)}
          onClose={this.handleMenuClose}
        >
          <MenuItem onClick={() => { this.props.deletePost(this.state.postID) }}><Delete /> &nbsp;Delete Post</MenuItem>
        </Menu>
      </Paper>
    )
  }

}

export default withRouter(Post);