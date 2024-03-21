/**
 * @class является придатком WS Server и реализует передачу и обработку запросов и сообщений 
 * как со стороны WS Server (сверху), так и со стороны RouteREPL, SensorManager, Control (снизу). 
 * Экземпляр класса инициализируется как поле класса WS Server при успешном создании последнего.
 */
class ClassProxyMQTT {
    /**
     * @constructor
     * @param {ClassMQTT} _mqtt - MQTT Server(publisher) object
     */
    constructor(_mqtt) {
        this._MQTT = _mqtt;
        
        let config = Process.GetMQTTClientConfig() || {};
        this._Subs = {sensor: {}} || config.subs;

        this._SkipData = false;
        this._DataSkipInterval = null;

        /************************************* SUB EVENTS **********************************/
        Object.on('sensor-sub', (topicName, channelId) => {
            this._Subs.sensor[channelId] = topicName;
        });   

        /************************************* READ EVENTS **********************************/
        /**
         * @typedef {Object} SMdata
        // Ex: { ID1: value1, ID2: value2 }
        /**
         * @event
         * Событие перехватывает и обрабатывает все сообщения от SensorManager
         * @param {SMdata} data
         */
        Object.on('sensor-data', data => {
            this.OnSensorData(data);
        });
        // this._MQTT.on('disconnected', () => {
        //     Object.emit('sensor-stop-polling');
        // });
    }
    TestReceive(msg) {
        Object.emit(msg.com, msg.arg);
    }
    /**
     * Обработчик данных, полученных от Sensor Manager 
     * @param {Object} data 
     */
    OnSensorData(data) {
        if (!this._DataSkipInterval || !this._SkipData) {

            Object.keys(this._Subs.sensor)
                .filter(subID => data[subID])
                .forEach(subID => this.Send(this._Subs.sensor[subID], data[subID]));
        }  
    }
    /**
     * @typedef {Object} TypeSubsObj
     * @prop {Object} sensor - объект, хранящий информацию о подписках на сенсоры
     * @prop {Object} process
     */
    /*Example: { sensor: { channel_id1 : topic_name1, channel_id2: topic_name2 } }; */
    /**
     * @method
     * Добавляет подписчиков на системные службы 
     * @param {TypeSubsObj} _subsObj - объект, хранящий коллекцию подписчиков на системные службы   
     */
    AddSubs(_serviceName, _serviceSubs) {
        if (!this._Subs[_serviceName] ||
            typeof _serviceSubs !== 'object') return false;

        // сохраняется ассоциация ID - название топика
        Object.keys(_serviceSubs).forEach(chId => {
            this._Subs[_serviceName][chId] = _serviceSubs[chId];
        });
    }
    /**
     * @method 
     * Удаление подписчиков из коллекции 
     * @param {String} _serviceName
     * @param {[String]} _serviceSubs
     */
    RemoveSubs(_serviceName, _serviceSubs) {
        if (!this._Subs[_serviceName] ||
            typeof _serviceSubs !== 'object') return false;
        
        _serviceSubs.forEach(chId => {
            delete this._Subs[_serviceName][chId];
        });
    }
    /**
     * @method 
     * Вызывается извне (со стороны MQTT) для передачи команд
     * @param {String} _data - команда в виде JSON-строки
     */
    Receive(_data) {
        let command_obj = null;
        try {
            command_obj = JSON.parse(_data);
        } catch (e) {
            throw new err('Incorrect JSON data');
        }
        Object.emit(command_obj.com, command_obj.arg);
    }
    /**
     * @method
     * Отправляет сообщение и соответствующий ему топик на MQTT-publisher
     * @param {String} topicName - идентификатор топика 
     * @param {String} data сообщение 
     */
    Send(topicName, data) { 
        // this._MQTT.Notify(data);      
        this._MQTT.publish(topicName, data);
    }
    /**
     * @method
     * Устанавливает максимальную частоту, с которой пакет сообщений рассылается на MQTT.
     * @param {Number} _freq - частота
     * @returns 
     */
    SetPubMaxFreq(_freq) {
        if (typeof _freq !== 'number' || _freq < 0) return false;

        this._DataSkipInterval = setInterval(() => {
            this._SkipData = !this._SkipData;
        }, 1/_freq*1000);

        return true;
    }
}
exports = ClassProxyMQTT;
