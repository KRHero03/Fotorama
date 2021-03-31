import { Component } from "react";
import { withRouter } from 'react-router-dom'
import firebase from 'firebase'
import { Box, Avatar, Typography,Dialog,Card,Link} from '@material-ui/core'
import { Skeleton } from '@material-ui/lab'

class UserView extends Component {

  constructor(props) {
    super(props)
    this.state = {
      id: this.props.id,
      displayName: '',
      photoURL: '',
      followers: 0,
      isLoading: true,
      isProfilePicModalOpen:false,
    }
  }

  async componentDidMount() {
    const dbRef = firebase.firestore()

    const userRef = dbRef.collection('users').doc(this.state.id)
    const followerRef = dbRef.collection('users').doc(this.state.id).collection('followers')

    const userResult = await userRef.get()
    const followerResult = await followerRef.get()

    if (!userResult.exists) {
      this.props.history.push('/')
      return
    }

    const userData = userResult.data()
    const followerData = followerResult.docs

    this.setState({
      ...this.state,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      followers: followerData.length,
      isLoading: false,
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
        <Skeleton type='rect' className='userViewPlaceholder' />
      )
    return (
      <Link href={'/profile/'+this.state.id} className='userViewLink'>
      <Card variant='outlined' style={{marginTop: 10,marginBottom: 10}}>
      <Box display='flex' justifyContent='space-between' alignItems='center' style={{padding: 10}}>
          <Box display='flex' alignItems = 'center'>
          <Avatar alt={this.state.displayName} src={this.state.photoURL.replace('s96-c', 's500-c')}  onClick={this.toggleProfilePicModal} />
          <Typography style={{marginLeft: 10}}>{this.state.displayName}</Typography>
          </Box>
          <Typography>{this.state.followers} {this.state.followers===1?'Follower':'Followers'}</Typography>

        <Dialog
          aria-labelledby='Profile Photo Dialog'
          aria-describedby='Profile Photo' onClose={this.toggleProfilePicModal} open={this.state.isProfilePicModalOpen}>
          <img src={this.state.photoURL.replace('s96-c', 's500-c')} alt='Profile' />
        </Dialog>
      </Box>
      </Card>
      </Link>
    )
  }

}

export default withRouter(UserView);