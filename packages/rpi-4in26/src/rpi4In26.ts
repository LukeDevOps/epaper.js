import { ColorMode, DisplayDevice, GrayLR, Monochrome, Orientation } from '@lukedevops/core';
import { ImageOptions } from '@lukedevops/core/src/image/imageOptions';
import bindings from 'bindings';
import { Driver } from './driver';

export class Rpi4In26 implements DisplayDevice {
    public readonly height: number;
    public readonly width: number;
    private readonly driver: Driver;

    constructor(public readonly orientation = Orientation.Horizontal, public readonly colorMode = ColorMode.Gray4) {
        const supportedColorModes = [ColorMode.Black, ColorMode.Gray4];
        if (!supportedColorModes.includes(colorMode)) {
            throw new Error(`Only color modes: [${supportedColorModes}] are supported`);
        }
        this.driver = bindings('waveshare4in26.node');
        this.height = this.orientation === Orientation.Horizontal ? 480 : 800;
        this.width = this.orientation === Orientation.Horizontal ? 800 : 480;
    }

    public connect(): void {
        console.log("attempting connection")
        this.driver.dev_init();
        console.log("connected!")
        this.wake();
    }

    public disconnect(): void {
        this.sleep();
        this.driver.dev_exit();
    }

    public wake(): void {
        console.log("colorMode: " + this.colorMode)
        if (this.colorMode === ColorMode.Gray4) {
            this.driver.init_4Gray();
            console.log("Initialised 4Gray mode")
        } else {
            this.driver.init();
            console.log("Initialised")
        }
    }

    public clear(): void {
        this.driver.clear();
    }

    public sleep(): void {
        this.driver.sleep();
    }

    public async displayPng(img: Buffer, options?: ImageOptions): Promise<void> {
        if (this.colorMode === ColorMode.Gray4) {
            await this.displayPngGray4(img, options);
        } else {
            await this.displayPngBW(img, options);
        }
    }

    private async displayPngBW(img: Buffer, options?: ImageOptions) {
        const converter = new Monochrome(img);
        const blackBuffer = await converter.toBlack({
            ...options,
            rotate90Degrees: this.orientation === Orientation.Horizontal,
        });
        this.driver.display(blackBuffer);
    }

    private async displayPngGray4(img: Buffer, options?: ImageOptions) {
        const converter = new GrayLR(img);
        const grayBuffer = await converter.to4Gray({
            ...options,
            rotate90Degrees: this.orientation === Orientation.Horizontal,
        });
        this.driver.display_4Gray(grayBuffer);
    }
}
