import React from "react";
import Button from "@material-ui/core/Button";
import Divider from "@material-ui/core/Divider";
import Container from "@material-ui/core/Container";
import Grid from "@material-ui/core/Grid";
import { Typography,Card } from "@material-ui/core";
import Logo from "../../logo.png";

import { withRouter } from 'react-router-dom'

class AboutUs extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      leftDrawer: false,
    }
  }
  render() {
    return (
      <Container className='home'>
      <Card  variant='outlined' style={{padding:10}}>
        <Grid container >
          <Grid item xs={12} className='homeCenter'>
            <div className=''>
              <img alt="XPert Logo" className='homeLogo' src={Logo} />
              <div style={{ fontSize: 30,textAlign: 'center' }}>Fotorama</div>
            </div>
          </Grid>
          <Grid container xs={12} justify="start">
            <Grid item>
              <Typography variant="h6" align="left">The Company</Typography>
              <p>
                Fotorama is an initiative to provide people throughout the world an
                opportunity to share their experiences in the most independent way possible.
                The Posts available on the website are completely copyrighted by their respective owners, as
                per the agreement in our Privacy Policy. For more details, please refer the Privacy Policy | Fotorama.

                </p>
              <p align="left">
                Fotorama started as a Social Media App in March, 2021 and is running since, with the love
                and wishes of the users.
                </p>
              <p align="left">
                It started as a Project and minimal idea to allow users to reach each other via their Posts
                but it has continuously grown since then.
                </p>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" align="left">The Team</Typography>
              <p align="left">
                Krunal Rank, Founder and CEO, Fotorama
                </p>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" align="left">Contact</Typography>
              <p align="left">
                Email: hola(at)fotorama(dot)com
                </p>
              <p align="left">
                Phone: +91 701 650 7648
                </p>
              <p align="left">
                Fax: +22 675 124 5
                </p>
              <p align="left" color="textSecondary">
                Fotorama<br />
                    NIT Surat, Surat<br />
                    India<br />
                    395007
                </p>
            </Grid>
          </Grid>

        </Grid>
      </Card>
      </Container>
    );
  }
}

export default withRouter(AboutUs);