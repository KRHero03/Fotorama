import { Component } from "react"
import { withRouter } from 'react-router-dom'
import { IconButton, CardHeader, Card, CardActions, CardContent, Container, Grid, Paper, TextField, Box, Fab, Tooltip, Zoom, Divider, Avatar, Typography, CircularProgress, Dialog, DialogContent, DialogTitle } from '@material-ui/core'
import firebase from 'firebase'
import { Send, Publish, MoreVert, Favorite, Cancel } from '@material-ui/icons'
import CameraIcon from '@material-ui/icons/Camera'
import Camera from 'react-html5-camera-photo'
import reduceFileSize from '../../utils/compress'



class CreatePost extends Component {

  constructor(props) {
    super(props)
    this.state = {
      user: this.props.user,
      imageUrl: '',
      postContent: '',
      sendingPost: false,
      isProfilePicModalOpen: false,
      isPhotoModalOpen: false,
      isCameraModalOpen: false,
      videoStream: null
    }
  }

  preventDefault = (e) => {
    e.preventDefault()
  }

  handleTextFieldChange = (e) => {
    if (e.target.value.length > 200) return;
    this.setState({
      ...this.state,
      postContent: e.target.value,
    })
  }

  onFileUpload = (e) => {
    let file = e.target.files[0]
    reduceFileSize(file, 500 * 1024, 1000, Infinity, 0.6, (file) => {

      let reader = new FileReader()
      reader.readAsDataURL(file)
      let flag = 0
      reader.onload = () => {
        if (!reader.result.startsWith('data:image'))
          flag = 1
        else {
          this.setState({
            ...this.state,
            imageUrl: reader.result
          })
        }
      };
      if (flag) {
        return
      }
    })

  }

  toggleProfilePicModal = () => {
    this.setState({
      ...this.state,
      isProfilePicModalOpen: !this.state.isProfilePicModalOpen
    })
  }

  togglePhotoModal = () => {
    this.setState({
      ...this.state,
      isPhotoModalOpen: !this.state.isPhotoModalOpen
    })
  }

  toggleCameraModal = async () => {
    await this.setState({
      ...this.state,
      isCameraModalOpen: !this.state.isCameraModalOpen
    })
    if (!this.state.isCameraModalOpen) {
      await Promise.all(this.state.videoStream.getTracks().map(async (t) => {
        console.log(t)
        await t.stop();
      }))
      this.setState({
        ...this.state,
        videoStream: null
      })
    }
  }

  handleUpload = async () => {
    const fileSelector = document.getElementById('fileUpload')
    fileSelector.click()
  }


  handleCameraStart = (stream) => {
    this.setState({
      ...this.state,
      videoStream: stream
    })
  }

  takeSnapPhoto = async () => {
    const videoElement = document.getElementsByTagName('video')[0]
    const canvas = document.createElement("canvas");
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    canvas.getContext('2d')
      .drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataURL = canvas.toDataURL();
    await this.setState({
      imageUrl: dataURL,
    })
    this.toggleCameraModal()
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

  createPostMethod = async () => {
    if (this.state.imageUrl.length === 0) {
      return
    }
    this.setState({
      ...this.state,
      sendingPost: true
    })

    try {
      let tags = this.state.postContent.split(/[\n\t ]+/).filter((e) => { return e.startsWith('#') }).map((e) => { return e.split('#') })
      tags = [].concat.apply([], tags).filter((e) => { return e.length !== 0 }).map((e) => { return e.toLowerCase() }).filter((v, i, a) => a.indexOf(v) === i)

      let dbRef = firebase.firestore()

      let postData = {
        byID: this.state.user.uid,
        imageUrl: this.state.imageUrl,
        likes: [],
        postContent: this.state.postContent,
        tags: tags,
        downloads: 0,
        timestamp: new Date().getTime(),
      }

      let postResult = await dbRef.collection('posts').add(postData)

      let postID = postResult.id.toString()

      await Promise.all(tags.map(async (tag) => {
        let tagRef = dbRef.collection('tags').doc(tag)
        let tagResult = await tagRef.get()
        if (!tagResult.exists) {
          await tagRef.set({
            posts: [postID],
            search: 0,
          })
        } else {
          let data = tagResult.data()
          tagRef.set({
            posts: [...data.posts, postID]
          })
        }
      }))

      this.setState({
        postContent: '',
        imageUrl: '',
        imageFile: null,
        sendingPost: false
      })
    } catch (e) {
      console.log(e)
    }



  }

  render() {
    if (this.state.sendingPost)
      return (
        <Grid item className='progressGrid' xs={12}>
          <CircularProgress color='secondary' />
        </Grid>
      )
    return (
      <Paper elevation={0}>
        <input hidden type="file" id='fileUpload' accept='.jpg,.jpeg,.png' onChange={this.onFileUpload} />
        <Grid className='createPost'>
          <Grid item xs={12}>
            <TextField
              className='createPostTextField'
              label="Write your Story"
              id="outlined-size-normal"
              variant="outlined"
              color='secondary'
              multiline
              onChange={this.handleTextFieldChange}
              value={this.state.postContent}

              rowsMax='3'
            />
            <Box display='flex' flexDirection='row-reverse'>
              <p>{200 - this.state.postContent.length} characters left.</p>
            </Box>
          </Grid>
          <Grid item xs={12}>

            <Box display='flex' flexDirection="row-reverse">
              <Tooltip TransitionComponent={Zoom} title="Create Post" aria-label="Create Post" arrow>
                <Fab color="secondary" className='createPostFAB' size='small' onClick={this.createPostMethod} >
                  <Send />
                </Fab>
              </Tooltip>
              <Tooltip TransitionComponent={Zoom} title="Upload Photo" aria-label="Upload Photo" arrow>

                <Fab color="secondary" className='createPostFAB' size='small' onClick={this.handleUpload} >
                  <Publish />
                </Fab>
              </Tooltip>
              <Tooltip TransitionComponent={Zoom} title="Snap Photo" aria-label="Snap Photo" arrow>
                <Fab color="secondary" className='createPostFAB' size='small' onClick={this.toggleCameraModal} >
                  <CameraIcon />

                </Fab>
              </Tooltip>
            </Box>
          </Grid>
          <Divider />
          {
            (this.state.postContent.length !== 0 || this.state.imageUrl.length !== 0)
              ?
              <Grid item xs={12} className='createPostPreview'>
                <Grid item xs={12}>
                  <Typography>Post Preview</Typography>
                </Grid>
                <Card variant='outlined' className='createPostCard'>
                  <CardHeader
                    avatar={
                      <Avatar alt={this.state.user.displayName} src={this.state.user.photoURL.replace('s96-c', 's500-c')} onClick={this.toggleProfilePicModal} />
                    }
                    action={
                      <IconButton aria-label="settings">
                        <MoreVert />
                      </IconButton>
                    }
                    title={this.state.user.displayName}
                    subheader={this.getTime(new Date().getTime())}
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
                    <IconButton aria-label="Like Post">
                      <Favorite />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
              :
              null
          }
        </Grid>
        <Dialog className='dialog'
          aria-labelledby='Profile Photo Dialog'
          aria-describedby='Profile Photo' onClose={this.toggleProfilePicModal} open={this.state.isProfilePicModalOpen}>
          <img src={this.state.user.photoURL.replace('s96-c', 's500-c')} alt='Profile' />
        </Dialog>
        <Dialog className='dialog'
          aria-labelledby='Photo Dialog'
          aria-describedby='Photo' onClose={this.togglePhotoModal} open={this.state.isPhotoModalOpen}>
          <img src={this.state.imageUrl} alt='Upload' />
        </Dialog>
        <Dialog className='dialog'
          aria-labelledby='Camera Photo Dialog'
          aria-describedby='Camera Photo' onClose={this.toggleCameraModal} onBackdropClick="false" onClick={this.preventDefault} open={this.state.isCameraModalOpen}>
          <DialogTitle className='cameraDialogTitle'>

            <Box display='flex' flexDirection='row-reverse' justifyContent='space-between' alignItems='center'>
              <IconButton onClick={this.toggleCameraModal}><Cancel /></IconButton>
              <div>
                Snap your Photo</div>
            </Box>
          </DialogTitle>
          <DialogContent className='cameraDialogContent'>

            <Camera isImageMirror={false}
              onCameraStart={this.handleCameraStart} />
            <Tooltip TransitionComponent={Zoom} title="Snap Photo" aria-label="Snap Photo" arrow>
              <Fab color="secondary" className='createPostFAB' size='small' onClick={this.takeSnapPhoto} variant='extended' >
                <CameraIcon />
                    Snap
                  </Fab>
            </Tooltip>
          </DialogContent>
        </Dialog>
      </Paper>

    )
  }

}

export default withRouter(CreatePost);