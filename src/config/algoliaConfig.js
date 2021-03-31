
import algoliasearch from 'algoliasearch'

const client = algoliasearch('RD2QJRUMG0','57da70e352897c8867d9c5aa9028e247')
const index = client.initIndex('fotorama_users')

export default index