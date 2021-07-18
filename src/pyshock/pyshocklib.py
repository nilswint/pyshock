#!/usr/bin/python3

from pyshock.pyshocklibdevices import ArduinoManager
from pyshock.sdr import Sender

import config

class Pyshock:
    def boot(self):
        arduino_required = False
        sdr_required = False
        
        for device in config.devices:
            if device.is_arduino_required():
                arduino_required = True
            if device.is_sdr_required():
                sdr_required = True

        arduino_manager = None
        if arduino_required:
            arduino_manager = ArduinoManager()
            arduino_manager.boot()

        sdr_sender = None
        if sdr_required:
            sdr_sender = Sender()

        for device in config.devices:
            device.boot(arduino_manager, sdr_sender)


    def command(self, action, device, level, duration):
        config.devices[device].command(action, level, duration)

    def get_config(self):
        result = []
        for device in config.devices:
            result.append(device.get_config())
        return result


class PyshockMock(Pyshock):
    def command(self, action, device, level, duration):
        print("command: " + str(action) + ", device: " + str(device) + ", level: " + str(level) + ", duration: " + str(duration))
    
    def boot(self):
        print("Loaded mock")