#!/bin/sh
pdm run ./parse.py -d
pdm run ./parse.py --all
pdm run ./database.py --dump