{
    "targets": [
        {
            "target_name": "waveshare4in26",
            "cflags!": [
                "-fno-exceptions",
                "-Wextra"
            ],
            "cflags_cc!": [ "-fno-exceptions" ],
            "sources": [ 
                "./src/c/EPD_4in26_node.cc",
                "./src/c/DEV_Config.c",
                "./src/c/EPD_4in26.c",
                "./src/c/dev_hardware_SPI.c",
                "./src/c/RPI_gpiod.c",
            ],
            "defines": [
                "RPI",
                "USE_DEV_LIB",
                "DEBUG",
            ],
            "include_dirs": [
                "<!@(node -p \"require('node-addon-api').include\")"
            ],
            "libraries": [
                "-lm",
                "-lgpiod"
            ]
        }
    ]
}
