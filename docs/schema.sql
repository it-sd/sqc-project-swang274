DROP TABLE IF EXISTS customer;
CREATE TABLE customer(
  customerID SERIAL PRIMARY KEY,
  firstName VARCHAR NOT NULL,
  lastName VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  password VARCHAR NOT NULL
);

DROP TABLE IF EXISTS trip;
CREATE TABLE trip(
  tripID SERIAL PRIMARY KEY,
  customerID INTEGER NOT NULL,
  trip_name VARCHAR(30),
  note VARCHAR(100)
);

DROP TABLE IF EXISTS tripStop;
CREATE TABLE tripStop(
  tripStopID SERIAL PRIMARY KEY,
  tripID INTEGER NOT NULL,
  stop_name VARCHAR(30),
  note VARCHAR(100),
  longitude Decimal(15, 4) NOT NULL,
  latitude Decimal(15, 4) NOT NULL,
  location VARCHAR(40)
);

ALTER TABLE tripStop
ADD CONSTRAINT tripStop_trip_fk
FOREIGN KEY (tripID)
REFERENCES trip (tripID);

ALTER TABLE trip
ADD CONSTRAINT trip_customer_fk
FOREIGN KEY (customerID)
REFERENCES customer (customerID);

-- DROP TABLE customer CASCADE;
-- DROP TABLE trip CASCADE;
-- DROP TABLE tripStop CASCADE;