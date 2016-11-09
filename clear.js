const pg = require('pg')

const client = new pg.Client({ password: 'sdflkj' })

client.connect(() => {

  console.log('Clearing stock table...')
  client.query('TRUNCATE TABLE stock', [], (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log('Successfully cleared table!')
    }

    client.end()
  })

})
