const net = require("net");

let korisnici = [];

const port = 3000;

const server = net.createServer();

server.on("connection", (socket) => {
  korisnici.push({
    username: "",
    soketKomunikacija: socket,
    ipAdresa: socket.remoteAddress,
    portKomunikacija:socket.remotePort,
    status: "online",
  });
  console.log(socket.remotePort);

  server.getConnections((err, broj) => {
    console.log("Konektovan klijent, broj klijenata " + broj);
  });
  console.log(socket.remoteAddress);

  socket.on("data", (data) => {
    try {
      const obj = data.toString();
      console.log(obj);
      const paket = JSON.parse(obj);

      switch (paket.zaglavlje) {
        case "prijava":
          /*  korisnici.push({
                    username:paket.data,
                    soketKomunikacija:socket,
                    ip:socket.remoteAddress,
                    status:"online"
                });*/
         
          for(let i=0;i<korisnici.length;i++){
            let korisnik = korisnici[i];
            if(korisnik.soketKomunikacija===socket  && korisnik.portKomunikacija===socket.remotePort){
              if (dostupanUsername(paket.data) && korisnik.username===""){
                korisnik.username = paket.data;
                socket.write("prijava<>Uspesna prijava " + paket.data +"<>"+korisnik.status +"<>potvrdno" + "\r\n");
              } else {
                socket.write("prijava<>Neuspesna prijava " + paket.data +" vec postoji<>nema<>negativno" +"\r\n");
              }
            }
          }

          break;

          case "usernameIstatus":
          korisnici.forEach((korisnik)=>{
              if(korisnik.soketKomunikacija===socket){
                socket.write("usernameIstatus<>" + korisnik.username + "<>"+korisnik.status+"<>potvrdno" + "\r\n");
              }
          });
          break;

          case "napraviIgru":
            korisnici.forEach((korisnik)=>{
              if(korisnik.soketKomunikacija===socket){
               korisnik.status="host";
               socket.write("usernameIstatus<>" + korisnik.username + "<>"+korisnik.status+"<>potvrdno" + "\r\n");
              }
          });
            break;

            case "status":
          korisnici.forEach((korisnik)=>{
            if(korisnik.soketKomunikacija===socket){
             korisnik.status=paket.data;
             socket.write("usernameIstatus<>" + korisnik.username + "<>"+korisnik.status+"<>potvrdno" + "\r\n");
            }
        });
          break;

          case "nadjiIgru":
            let igraci="";
            for(let i=0;i<korisnici.length;i++){
              if(korisnici[i].status==="host"){
                igraci=igraci+""+korisnici[i].username+"-"+korisnici[i].status+">>";
              }
            }
            igraci+="kraj";
           // proveri ovde ako bude bilo gresaka
              
               socket.write("nadjiIgru<>"+igraci+"<>potvrdno" + "\r\n");
          ;
            
            break;

          case"zahtevZaIgru":
          for(let i=0;i<korisnici.length;i++){
            if(korisnici[i].username===paket.host && korisnici[i].status==="host"){
              korisnici[i].soketKomunikacija.write("zahtevZaIgru<>"+paket.igrac+"<>potvrdno" + "\r\n");
            }
          }
            break;   

          case "pokreniIgru":
            let host;
            let gost;
            for(let i=0;i<korisnici.length;i++){
              if(korisnici[i].username===paket.igrac){
                gost=korisnici[i];
              }else if(korisnici[i].soketKomunikacija===socket){
                host=korisnici[i];
              }
            }
            host.status="igra";
            gost.status="igra";
            host.soketKomunikacija.write("pokreniIgru<>"+gost.username+"<>X<>true<>potvrdno" + "\r\n");
            gost.soketKomunikacija.write("pokreniIgru<>"+host.username+"<>O<>false<>potvrdno" + "\r\n")
            break;
           
          case"potez":

          for(let i=0;i<korisnici.length;i++){
            if(korisnici[i].username===paket.igrac){
              korisnici[i].soketKomunikacija.write("potez<>"+paket.polje+"<>potvrdno" + "\r\n");
            }
          }

            break;

          case "rezultat":
            for(let i=0;i<korisnici.length;i++){
              if(korisnici[i].username===paket.igrac){
                korisnici[i].soketKomunikacija.write("rezultat<>"+paket.rezultat+"<>potvrdno" + "\r\n");
              }
            }

            break;
            case "revans":
            let igrac="";
              for(let i=0;i<korisnici.length;i++){
                if(korisnici[i].soketKomunikacija===socket){
                  igrac=korisnici[i].username;
                }
              }

            for(let i=0;i<korisnici.length;i++){
              if(korisnici[i].username===paket.igrac && igrac!==""){
                korisnici[i].soketKomunikacija.write("revans<>"+igrac +"<>potvrdno" + "\r\n");
              }
            }

            break;

            case "revansOdgovor":
            for(let i=0;i<korisnici.length;i++){
              if(korisnici[i].username===paket.igrac){
                korisnici[i].soketKomunikacija.write("revansOdgovor<>"+korisnici[i].username +"<>"+paket.potvrda + "\r\n");
              }
            }

            break;

            case "predaja":
            for(let i=0;i<korisnici.length;i++){
              if(korisnici[i].soketKomunikacija===socket){
                korisnici[i].status="online";
              }else if(korisnici[i].username===paket.igrac){
                korisnici[i].soketKomunikacija.write("predaja<>"+"protivnik je predao igru<>"+paket.potvrda + "\r\n");
              }
            }

            break;

            case"napustanje":
            for(let i=0;i<korisnici.length;i++){
              if(korisnici[i].soketKomunikacija===socket){
                korisnici[i].status="online";
              }else if(korisnici[i].username===paket.igrac){
                korisnici[i].soketKomunikacija.write("napustanje<>"+"Protivnik je napustio igru<>"+paket.potvrda + "\r\n");
              }
            }
              break;
          case "odjava":
          //ovde je bilo brisanje iz niza
          socket.write("OdjavaKorisnika\r\n");
           break;
        
        
      }
    } catch (err) {
      console.log(err + "Idemo dalje");
    }
  });

  socket.on("close", () => {
    for (let i = 0; i < korisnici.length; i++) {
      if (korisnici[i].soketKomunikacija === socket) {
        let korisnik = korisnici[i];
        korisnici.splice(i, 1);
        socket.write("Dovidjenja " + korisnik.username + "\r\n");
      }
    }

    console.log("Diskonektovao se klijent");
    console.log(`Broj korisnika ${korisnici.length}`);
  });

  socket.on("error", (err) => {
    console.log("Klijent greska\n" + err);
  });

  socket.on("timeout", () => {
    console.log("Timeout");
    for (let i = 0; i < korisnici.length; i++) {
      if (korisnici[i].soketKomunikacija === socket) {
        let korisnik = korisnici[i];
        korisnici.splice(i, 1);
        console.log("Izbacen korisnik "+korisnik.username);
      }
    }
  });
});

server.on("error", (err) => {
  console.log("Server greska");
});

server.listen(port, () => {
  console.log(`Server je podignut na portu ${port}`);
});

function dostupanUsername(ime) {
  for (let i = 0; i < korisnici.length; i++) {
    if (korisnici[i].username === ime) {
      return false;
    }
  }
  return true;
}
