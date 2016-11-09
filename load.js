const [,,ticker] = process.argv

const pg = require('pg')
const _ = require('underscore')

console.log('Acquiring data...')
const data = require('./data.json').stock[ticker]
const target = 0.06
const pricePartitionSize = 64
const volumePartitionSize = 64

const keys = _.keys(data)
const priceMin = _.chain(keys)
  .map(key => data[key].l)
  .min()
  .value()
const priceMax = _.chain(keys)
  .map(key => data[key].h)
  .max()
  .value()
const pricePartitions = buildPartitions(priceMin, priceMax, pricePartitionSize)
const volumeMin = _.chain(keys)
  .map(key => data[key].v)
  .min()
  .value()
const volumeMax = _.chain(keys)
  .map(key => data[key].v)
  .max()
  .value()
const volumePartitions = buildPartitions(volumeMin, volumeMax, volumePartitionSize)

const client = new pg.Client({ password: 'sdflkj' })
let query = 'INSERT INTO stock VALUES '
const values = []

console.log(`${ticker} has ${keys.length.toLocaleString()} keys`)

client.connect(() => {

  buildQuery()
  executeQuery()

})

function buildPartitions(min, max, size) {
  const partitions = []
  let n = min
  const interval = (max - min) / size
  while (n < priceMax) {
    partitions.push(n)
    n += interval
  }
  return partitions.reverse()
}

function buildQuery() {
  keys.forEach(buildRowQuery)
  query += values.join(',')
}

function encodeTicker(ticker) {
  return [
    'AC',
    'ALI',
    'AP',
    'BDO',
    'BPI',
    'EDC',
    'ICT',
    'JFC',
    'MBT',
    'MPI',
    'SM',
    'SMPH',
    'TEL',
    'URC',
  ].indexOf(ticker)
}

function encodePrice(price) {
  return pricePartitions.length - _.findIndex(pricePartitions, partition => price >= partition) - 1
}

function encodeVolume(volume) {
  return volumePartitions.length - _.findIndex(volumePartitions, partition => volume >= partition) - 1
}

function buildRowQuery(key) {
  const datum = data[key]
  const date = new Date(key * 1000)
  const dateString = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
  const year = date.getYear() - 90
  const month = date.getMonth() + 1
  const day_of_week = date.getDay()
  const week_of_month = Math.ceil(date.getDate() / 7)
  const change = (datum.c - datum.o) / datum.o

  values.push(`(DEFAULT,
    '${ticker}',
    '${dateString}',
    ${year},
    ${month},
    ${day_of_week},
    ${week_of_month},
    ${datum.o},
    ${datum.h},
    ${datum.l},
    ${datum.c},
    ${datum.v},
    ${change},
    ${change > target},
    ${encodeTicker(ticker)},
    ${encodePrice(datum.o)},
    ${encodePrice(datum.h)},
    ${encodePrice(datum.l)},
    ${encodePrice(datum.c)},
    ${encodeVolume(datum.v)}
  )`)
}

function executeQuery() {

  console.log('Loading data to postgresql...')
  client.query(query, [], (err) => {
    if (err) {
      console.log(err)
    } else {
      console.log(`Data load for ${ticker} successful!`)
    }

    client.end()
  })

}
