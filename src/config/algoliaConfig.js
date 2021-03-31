
import algoliasearch from 'algoliasearch'

const client = algoliasearch(process.env.REACT_APP_ALGOLIA_APPID,process.env.REACT_APP_ALGOLIA_ADMIN_KEY)
const index = client.initIndex('fotorama_users')

export default index