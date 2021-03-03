import * as dgram from "dgram";
 
//TypeScript
 
var $socket: dgram.Socket;
var $magicPacket: Buffer;
 
//构建魔数包
function makeMagicPacket(mac: string): Buffer {
  let hex: string = "ffffffffffff";
  let result: Buffer;
  
  //重复16次mac地址
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
  hex += mac;
 
  result = new Buffer(hex, "hex");
  return result;
}
 
function initSocket() {
  try {
    //构建魔数包 "224466881234" 为目标主机的活动网卡MAC地址
    $magicPacket = makeMagicPacket("0025229877A3");
 
    //创建UDP
    $socket = dgram.createSocket("udp4");
 
    if ($socket) {
      $socket.on("listening", () => {
        //启用广播
        $socket.setBroadcast(true);
        //广播魔数包
        $socket.send($magicPacket, 9, "255.255.255.255");
      });
 
      $socket.bind(0);
    }
  } catch (err) {
    console.error(err);
  }
}
 
function main() {
  initSocket();
}
 
main();