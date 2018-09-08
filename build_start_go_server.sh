#!/bin/bash
echo "Running go server..."
cd go/src/card_server
go build && ./card_server
