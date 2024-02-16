const err = require('M_AppError');
    require('ModuleAppMath').is();
const ClassWifi   = require('ModuleWifi');
const ClassI2C    = require('ModuleI2CBus');
const ClassVL6180 = require('ModuleVL6180');
const ClassSHT31  = require('ModuleSHT31');
const ClassSM     = require('ModuleSensorManager');
const ClassMiddleSensor = require('ModuleSensor');

let proxy;
const sm = new ClassSM();
const I2Cbus = new ClassI2C();

const bus1 = I2Cbus.AddBus({sda: P6, scl: P3, bitrate: 100000 }).IDbus;
const sensor_props_vl = ({
    id: "id-proximity",
    name: "VL6180",
    type: "sensor",
    channelNames: ['light', 'range'],
    minRange: [0.08, 5],
    maxRange: [20800, 200],
    typeInSignal: "analog",
    typeOutSignal: "digital",
    quantityChannel: 2,
    busTypes: ["i2c"],
});

const vl6180 = new ClassVL6180({bus: bus1, pins: [] }, sensor_props_vl); 
const light = vl6180.GetChannel(0);
const range = vl6180.GetChannel(1);
light.Start();
range.Start();

let wifi = new ClassWifi(P0, P1);
let mqtt;

setTimeout( () => {
    mqtt = require("MQTT").connect({
        host: "192.168.1.54"
    });
    proxy = new (require('ModuleProxyMQTT'))(mqtt);

    proxy.AddSubs('sensor', {
        "id-proximity-0": 'sensors/light',
        "id-proximity-1": 'sensors/range'
    });

}, 7500);

