DROP TABLE IF EXISTS stock;

CREATE TABLE stock (

  id SERIAL PRIMARY KEY,

  ticker TEXT,

  stamp DATE,

  year INT,
  month INT,
  day_of_week INT,
  week_of_month INT,

  open NUMERIC,
  high NUMERIC,
  low NUMERIC,
  close NUMERIC,
  volume INT,

  oc_change NUMERIC,
  is_profit BOOLEAN,

  ticker_e INT,
  open_e INT,
  high_e INT,
  low_e INT,
  close_e INT,
  volume_e INT

);
