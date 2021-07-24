setInterval('clock()', 1000);

function clock() {
    var t = document.getElementById("clock").innerHTML.split(":");
    var h = parseInt(t[0]);
    var m = parseInt(t[1]);
    var s = parseInt(t[2]);
    s++;
    if(s == 60){
        m++;
        s = 0;
    }
    if(m == 60){
        h++;
        m = 0;
    }
    if(h == 24){
        h=0;
    }
    h = checkTime(h);
    m = checkTime(m);
    s = checkTime(s);
    document.getElementById('clock').innerHTML = h + ":" + m + ":" + s;
}
function checkTime(i) {
    if (i < 10){
        i = "0" + i;
    }
    return i;
}