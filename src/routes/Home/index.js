import { Component } from "react"
import { Container, Button, Typography } from '@material-ui/core'
import Logo from '../../logo.png'
import GoogleLogo from '../../assets/google_logo.png'
import firebase from 'firebase'
import Skeleton from '@material-ui/lab/Skeleton'
import { withRouter } from 'react-router-dom'
import Dashboard from '../Dashboard'
class Home extends Component {

  constructor(props) {
    super(props)
    this.state = {
      isAuthenticated: false,
      user: false,
      isLoading: true,
    }
  }

  componentDidMount() {
    console.log(process.env)
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        this.setState({
          isAuthenticated: true,
          user: user,
          isLoading: false
        })
      } else {
        this.setState({
          isAuthenticated: false,
          user: null,
          isLoading: false,
        })
      }
    })
  }


  signInMethod = async () => {
    const provider = new firebase.auth.GoogleAuthProvider()
    provider.addScope("profile")
    try {
      await firebase.auth().signInWithPopup(provider);
      const user = await firebase.auth().currentUser;
      if (!user) return;
      this.setState({
        isAuthenticated: true,
        user: user,
        isLoading: false
      })

    } catch (err) {
      console.log(err);

    }

  }


  render() {

    if (this.state.isAuthenticated) return (<Dashboard />)
    if (this.state.isLoading)
      return (
        <Container className='home'>
          <Container className='homeCenter'>
            <Skeleton variant="circle" className='homeLogoPlaceholder' />
          </Container>
          <Container className='homeCenter'>
            <Skeleton variant="rect" className='homeTitlePlaceholder' />
          </Container>
          <Container className='homeCenter'>
            <Skeleton variant="rect" className='homeButtonPlaceholder' />
          </Container>
        </Container>
      )
    return (
      <Container className='home'>
        <Container className='homeCenter'>
          <img src={Logo} alt="Logo" className='homeLogo' />
        </Container>
        <Container className='homeCenter'>
          <Typography variant='h3'>
            Fotorama
          </Typography>
        </Container>
        <Container className='homeCenter'>
          <Button onClick={this.signInMethod} className='signInButton' variant="contained" color="primary">
            <img src={GoogleLogo} alt="GoogleLogo" className='homeGoogleLogo' />
            SIGN IN WITH GOOGLE
          </Button>
        </Container>
      </Container>
    )
  }

}

export default withRouter(Home);