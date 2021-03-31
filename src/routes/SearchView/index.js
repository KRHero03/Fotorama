import React, { Component }from "react";

import { withRouter } from 'react-router-dom'
import { Grid, Paper, Box, Typography, Tabs, Tab, Card,Snackbar,IconButton} from '@material-ui/core'
import {Close} from '@material-ui/icons'
import { Skeleton } from '@material-ui/lab'
import firebase from 'firebase'
import UserView from '../../components/UserView'
import Post from '../../components/Post'
import InfiniteScroll from 'react-infinite-scroll-component'
import index from '../../config/algoliaConfig'

class SearchView extends Component {
  constructor(props) {
    super(props)
    this.state = {
      search: this.props.match.params.id,
      isPostLoading: true,
      isAccountLoading: true,
      isLoading: true,
      posts: [],
      accounts: [],
      postLoadLength: 10,
      accountLoadLength: 10,
      tabValue: 0,
      snackbarText: '',
      openSnackbar: false,

    }
  }

  async componentDidMount() {
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
      } else {
        this.props.history.push('/')
      }
    })
    if (this.state.search.length >= 25) {
      this.props.history.push('/')
      return
    }
    const response = await index.search(this.state.search)
    const hits = response.hits
    let accounts = []
    hits.forEach((h) => {
      accounts.push(h.uid)
    })
    this.setState({
      ...this.state,
      accounts: accounts,
      isAccountLoading: false,
    })


    const dbRef = firebase.firestore()
    const tagRef = dbRef.collection('tags').doc(this.state.search)
    const tagResult = await tagRef.get()

    if (tagResult.exists) {
      const tagData = tagResult.data()
      await tagRef.set({
        search: tagData.search?tagData.search:0+1
      },{merge:true})
      let posts = []
      tagData.posts.forEach((id) => {
        posts.push(id)
      })
      this.setState({
        ...this.state,
        isPostLoading: false,
        posts: posts
      })
    }

    this.setState({
      isLoading: false,
    })

  }

async componentWillReceiveProps(nextProps) {
    if (nextProps.match.params.id === this.state.search) return
    this.setState({
      search: nextProps.match.params.id,
      isLoading: true,
    })
    if (this.state.search.length >= 25) {
      this.props.history.push('/')
      return
    }
    const response = await index.search(this.state.search)
    const hits = response.hits
    let accounts = []
    hits.forEach((h) => {
      accounts.push(h.uid)
    })
    this.setState({
      ...this.state,
      accounts: accounts,
      isAccountLoading: false,
    })


    const dbRef = firebase.firestore()
    const tagRef = dbRef.collection('tags').doc(this.state.search)
    const tagResult = await tagRef.get()

    if (tagResult.exists) {
      const tagData = tagResult.data()
      await tagRef.set({
        search: tagData.search?tagData.search:0+1
      },{merge:true})
      let posts = []
      tagData.posts.forEach((id) => {
        posts.push(id)
      })
      this.setState({
        ...this.state,
        isPostLoading: false,
        posts: posts
      })
    }

    this.setState({
      isLoading: false,
    })

    
  }

  handleTabChange = (event, value) => {
    this.setState({
      ...this.state,
      tabValue: value
    })
  }
  loadMorePosts = () => {
    this.setState({
      ...this.state,
      postLoadLength: Math.min(this.state.postLoadLength + 10, this.state.posts.length)
    })
  }

  loadMoreAccounts = () => {
    this.setState({
      ...this.state,
      accountLoadLength: Math.min(this.state.accountLoadLength + 10, this.state.accounts.length)
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

        <Grid item xs={12}>
          <Paper elevation={0}>
            <Grid item xs={12}>

              <Tabs
                value={this.state.tabValue}
                onChange={this.handleTabChange}
                indicatorColor="secondary"
                textColor="secondary"
                centered
              >
                <Tab label="Posts" />
                <Tab label="Users" />
              </Tabs>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          {
            this.state.tabValue === 0
              ?
              this.state.posts.length === 0
              ?
              <Card variant='outlined' style={{ marginTop: 20 }}>
                <Typography style={{ textAlign: 'center' }} variant='h4'> No Matching Posts</Typography>
              </Card>
              :
              <InfiniteScroll
                dataLength={this.state.posts.length}
                next={this.loadMorePosts}
                hasMore={true}
              >
                {this.state.posts.slice(0, this.state.postLoadLength).map((id) => {
                  return (
                    <Grid item xs={12}>
                      <Post key={id} deletePost={this.deletePost} id={id} />
                    </Grid>
                  )
                })}
              </InfiniteScroll>
              :
              this.state.accounts.length === 0
                ?
                <Card variant='outlined' style={{ marginTop: 20 }}>
                  <Typography style={{ textAlign: 'center' }} variant='h4'> No Matching Users</Typography>
                </Card>
                :
                <InfiniteScroll
                  dataLength={this.state.posts.length}
                  next={this.loadMorePosts}
                  hasMore={true}
                >
                  {this.state.accounts.slice(0, this.state.accountLoadLength).map((account) => {
                    return (
                      <Grid item xs={12}>
                        <UserView id={account} />
                      </Grid>
                    )
                  })}
                </InfiniteScroll>

          }
        </Grid>

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

export default withRouter(SearchView);