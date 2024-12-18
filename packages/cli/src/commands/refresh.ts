import { DisplayDevice, getPageRpi, BrowserPage, Logger } from '@lukedevops/core';
import { getDevice } from '../deviceFactory';
import { Command } from './command';
import { DisplayArgs } from './display';

export interface RefreshArgs extends DisplayArgs {
    interval?: number;
    loops?: number;
}

export class RefreshCommand implements Command<RefreshArgs> {
    private displayDevice?: DisplayDevice;
    private browserPage?: BrowserPage;

    constructor(private readonly logger: Logger) {}

    public async execute(refreshArgs: RefreshArgs) {
        this.logger.log(`Connecting to ${refreshArgs.deviceType} screen`);
        this.displayDevice = await getDevice(refreshArgs.deviceType, refreshArgs.orientation, refreshArgs.colorMode);
        this.displayDevice.connect();
        this.logger.log(`Connected`);
        this.browserPage = await getPageRpi(this.displayDevice.width, this.displayDevice.height, this.logger);
        await this.loopExecutor(refreshArgs, refreshArgs.loops)
    }

    public async dispose() {
        this.logger.log('Powering off display and exiting...');
        this.displayDevice!.disconnect();
        await this.browserPage!.close();
    }

    private async loopCallback(refreshArgs: RefreshArgs, skipSleep: boolean = false) {
        const imgOfUrl = await this.browserPage!.screenshot(refreshArgs.url, {
            delay: refreshArgs.screenshotDelay,
            username: refreshArgs.username,
            password: refreshArgs.password,
        });
        this.logger.log('Waking up display');
        this.displayDevice!.wake();
        this.logger.log(`Displaying ${refreshArgs.url}`);
        const dither = refreshArgs.dither
        await this.displayDevice?.displayPng(imgOfUrl, { dither });
        if (skipSleep) return; 
        this.displayDevice!.sleep();
        this.logger.log('Putting display into low power mode');
        await this.sleep(refreshArgs.interval);
    }

    private async loopExecutor(refreshArgs: RefreshArgs, loops: number = 6) {
        if (loops > 0) {
            for (let i = 0; i < loops; i++) {
                await this.loopCallback(refreshArgs, i==loops-1)
            }
        }
        else {
            while (true) {
               await this.loopCallback(refreshArgs)
            }
        }
    }

    private sleep(seconds: number = 600) {
        if (seconds > 60) {
            const min = Math.floor(seconds / 60);
            const remainingSec = (seconds % 60).toString().padStart(2, '0');
            this.logger.log(`Next refresh in ${min}m:${remainingSec}s`);
        } else {
            this.logger.log(`Next refresh in ${seconds}s`);
        }
        return new Promise((resolve) => setTimeout(resolve, seconds * 1000));
    }
}
