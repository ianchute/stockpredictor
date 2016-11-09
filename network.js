const pg = require('pg')
const _ = require('underscore')
const jsonfile = require('jsonfile')
const { Architect, Network, Trainer } = require('synaptic')

Number.prototype.g = function(n) {
  return (+(this ^ (this >>> 1)).toString(2)).padLeft(n).split('').map(Number)
}

Number.prototype.padLeft = function (n,str) {
  return Array(n-String(this).length+1).join(str||'0')+this;
}

console.log('Acquiring data...')
const client = new pg.Client({ password: 'sdflkj' })

client.connect(() => {

  executeQuery()
    .then(learn)

})

function preprocess(data) {

  const frames = []

  for (let i = 0; i + 6 < data.length; ++i) {

    console.log(`Preprocessing frame ${i + 1}...`);

    // INPUT:

    const input =

      [
        // ...data[i].year.g(3),
        ...data[i].month.g(4),
        ...data[i].day_of_week.g(3),
        ...data[i].week_of_month.g(3),

        // ...data[i+4].year.g(3),
        ...data[i+5].month.g(4),
        ...data[i+5].day_of_week.g(3),
        ...data[i+5].week_of_month.g(3),

        ...([i, i+1, i+2, i+3, i+4, i+5]
          .map(index => data[index])
          .map(x => [
            ...x.open_e.g(6),
            ...x.high_e.g(6),
            ...x.close_e.g(6),
            ...x.low_e.g(6),
            ...x.volume_e.g(6),
          ])
          .reduce((a, b) => { return [...a, ...b] }, []))
      ]



    // OUTPUT:

    const result = data[i+6]
    // const output =
    //   // o,h,l,c,v = 5 features * 8 (2^8 partitions) * 1 frame = (gray code: 40 bits)
    //   // TOTAL: 40 bits
    //   [
    //     ...result.open_e.g(8),
    //     ...result.high_e.g(8),
    //     ...result.close_e.g(8),
    //     ...result.low_e.g(8),
    //     ...result.volume_e.g(8)
    //   ]

    const output = [...result.open_e.g(6),...result.close_e.g(6)]

    frames.push({ input, output })

  }

  return frames
}

function executeQuery() {

  return new Promise(resolve => {
    client.query('SELECT open_e, high_e, low_e, close_e, volume_e, month, day_of_week, week_of_month, year, is_profit FROM stock WHERE ticker = \'BPI\' AND (year = 14);',
      [],
      (err, results) => {
        console.log(`There are ${results.rows.length} rows!`)
        const preprocessed = preprocess(results.rows)
        resolve(preprocessed)
      })
  })

}

function learn(frames) {

  client.end()

  const layers = [frames[0].input.length, 384, frames[0].output.length]
  console.log('Building network...', layers.join('-'))
  const network = new Architect.Perceptron(...layers)

  console.log('Building trainer...')
  const trainer = new Trainer(network)

  const trainingSet = frames
  console.log(`Starting training... Training Set: ${trainingSet.length} frames.`)
  trainer.train(trainingSet, {
    rate: 0.0085,
    iterations: 20000,
    error: .005,
    log: 1,
    cost: Trainer.cost.CROSS,
    crossValidate: {
      testSize: 0.3,
      testError: 0.005
    }
  })

  jsonfile.writeFile(
    `model.json`,
    network.toJSON(),
    err => console.error(err)
  )

}
