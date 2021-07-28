var accounts = localStorage.getItem('accounts')
var names = localStorage.getItem('names')
var hideAddress = (localStorage.getItem('hideAddress') === 'true')
var currCurrency = localStorage.getItem('currency')
var currencies = ['php', 'aud', 'cny', 'eur', 'gbp', 'hkd', 'jpy', 'myr', 'sgd', 'usd']

if (!currCurrency) currCurrency = 'usd'
populate_currency()

var storeAccounts = []
var storeNames = {}
if (accounts && names) {
    storeAccounts = JSON.parse(accounts)
    storeNames = JSON.parse(names)
}

var $table = $('#table-accounts')
var skillPrice = 0
var bnbPrice = 0
var oraclePrice = 0
var usdPrice = 0

getPrices()
getOraclePrice()

$table.bootstrapTable('showLoading')
retrieve_account()

function populate_currency() {
    $('#select-currency').html();
    $("#select-currency").append(new Option(currCurrency.toUpperCase(), currCurrency));
    currencies.forEach(curr => {
        if(currCurrency !== curr) {
            $("#select-currency").append(new Option(curr.toUpperCase(), curr));
        }
    })
}

function retrieve_account() {
    if (storeAccounts) {
        $.get(`/account/retrieve/${window.btoa(JSON.stringify(storeAccounts))}`, (result) => {
            if (result.error) {
                alert(result.error)
                result = []
            } else {
                populate_cards(result)
            }
            $table.bootstrapTable({data: result, classes: 'table table-bordered'})
            $table.bootstrapTable('hideLoading')
        })        
    }
}

function add_account() {
    var name = $('#inp-name').val().trim()
    var address = $('#inp-address').val().trim()
    if (storeAccounts.find(account => account === address)) return
    $.get(`/account/add/${address}`, (result) => {
        if(result.valid) {
            $('#modal-add-account').modal('hide');
            storeAccounts.push(address)
            storeNames[address] = name            
            refresh()
        }
    })
}

$('#modal-add-account').on('shown.bs.modal', function (e) {
    $('#inp-name').val('')
    $('#inp-address').val('')
});

function rename_account() {
    var name = $('#inp-rename').val().trim()
    var address = $('#inp-readdress').val().trim()
    $('#modal-rename-account').modal('hide');
    storeNames[address] = name
    reload_data()
}

function reload_data() {
    localStorage.setItem('accounts', JSON.stringify(storeAccounts))
    localStorage.setItem('names', JSON.stringify(storeNames))

    $table.bootstrapTable('showLoading')
    $.get(`/account/retrieve/${window.btoa(JSON.stringify(storeAccounts))}`, (result) => {
        if (result.error) {
            alert(result.error)
            result = []
        } else {
            populate_cards(result)
        }
        $table.bootstrapTable({data: result, classes: 'table table-bordered'})
        $table.bootstrapTable('hideLoading')
    })
}

function refresh() {
    reload_data()
    getPrices()
    getOraclePrice()
}

function populate_cards(result) {
    let uskills = 0, sskills = 0, balance = 0, bnb = 0, chars = 0
    result.forEach(data => {
        uskills += parseFloat(data.unclaimed)
        sskills += parseFloat(data.rewards)
        balance += parseFloat(data.balance)
        bnb += parseFloat(data.bnb)
        chars += data.characters.length
    })    
    $('#card-acc').html(`${result.length}${(chars > 0) ? ` (${chars} Characters)` : ''} `)
    $('#card-uskills').html(convertSkill(uskills))
    $('#card-sskills').html(convertSkill(sskills))
    $('#card-balance').html(convertSkill(balance))
    $('#card-sassets').html(convertSkill(uskills + sskills + balance))
    $('#card-bnb').html(convertBNB(bnb))
}

function charFormatter(val) {
    return val.map(char => {
        return `${char.charId} | Lv. ${char.level} | ${elemToColor(char.element)} | ${char.exp} xp | Lv. ${char.nextLevel} (${(!char.mustClaim ? `${char.nextExp} xp left` : '<span style="color: gold">Claim Exp</span>')}) | (${staminaToColor(char.sta)}/200)`
    }).join('<br>')
}

function elemToColor(elem){
    switch(elem) {
        case 'Fire': return `<span style='color: red'>${elem}</span>`
        case 'Earth': return `<span style='color: green'>${elem}</span>`
        case 'Lightning': return `<span style='color: yellow'>${elem}</span>`
        case 'Water': return `<span style='color: cyan'>${elem}</span>`        
        default: return `<span style='color: red'>${elem}</span>`
    }
}

function staminaToColor(stamina){
    stamina = parseInt(stamina)
    if (stamina < 40) return stamina
    if (stamina < 80) return `<span style='color: green'>${stamina}</span>`
    if (stamina < 120) return `<span style='color: yellow'>${stamina}</span>`
    if (stamina < 160) return `<span style='color: orange'>${stamina}</span>`
    return `<span style='color: red'>${stamina}</span>`
}

function currFormatter(val) {
    return parseFloat(val).toFixed(6)
}

function bnbFormatter(val) {
    var bnb = parseFloat(val).toFixed(6);
    if (parseFloat(val) < 0.01) return `<span class='text-danger'>${bnb}</span>`
    if (parseFloat(val) < 0.03) return `<span class='text-warning'>${bnb}</span>`
    return `<span class='text-success'>${bnb}</span>`
}

function stakedFormatter(val, row) {
    return `${parseFloat(val).toFixed(6)}${(row.timeLeft ? ` (${row.timeLeft})` : '')}`
}

function nameFormatter(val) {
    return storeNames[val]
}

function privacyFormatter(val) {
    if (hideAddress) return addressPrivacy(val)
    return val
}

function getPrices() {
    $.get(`https://api.coingecko.com/api/v3/simple/price?ids=cryptoblades,binancecoin,tether&vs_currencies=${currencies.join(',')}`, (result) => {
        skillPrice = result.cryptoblades[currCurrency]
        bnbPrice = result.binancecoin[currCurrency]
        usdPrice = result.tether[currCurrency]
        $('#card-price').html(skillPrice.toLocaleString('en-US', { style: 'currency', currency: currCurrency.toUpperCase() }))
    })
}

function getOraclePrice() {
    $.get('/oracle/price', (result) => {
        oraclePrice = result.price
        $('#card-oprice').html(`${oraclePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD' })} (${(oraclePrice * usdPrice).toLocaleString('en-US', { style: 'currency', currency: currCurrency.toUpperCase() })})`)
    })
}

function convertSkill(value) {
    return (parseFloat(value) > 0 ? `${parseFloat(value).toFixed(6)} (${(parseFloat(value) * parseFloat(skillPrice)).toLocaleString('en-US', { style: 'currency', currency: currCurrency.toUpperCase() })})` : 0)
}

function convertBNB(value) {
    return (parseFloat(value) > 0 ? `${parseFloat(value).toFixed(6)} (${(parseFloat(value) * parseFloat(bnbPrice)).toLocaleString('en-US', { style: 'currency', currency: currCurrency.toUpperCase() })})` : 0)
}

function remove(address) {
    storeAccounts.splice(storeAccounts.indexOf(address), 1)
    delete storeNames[address]
    reload_data()
}

function simulate(address, data) {
    const { characters, weapons } = JSON.parse(window.atob(data))
    $('#combat-name').val(storeNames[address])
    $('#combat-address').val(address)
    $('#combat-character').html(new Option('Select character', ''))
    $('#combat-weapon').html(new Option('Select weapon', ''))
    $('#combat-result').html('')
    characters.forEach(character => {
        $("#combat-character").append(new Option(`${character.charId} | ${character.element} | Lv. ${character.level}`, window.btoa(JSON.stringify(character))));
    })
    weapons.forEach(weapon => {
        $("#combat-weapon").append(new Option(`${weapon.id} | ${weapon.stars + 1}-star ${weapon.element}`, window.btoa(JSON.stringify(weapon))));
    })
    $('#modal-combat').modal({
        backdrop: 'static',
        keyboard: false
    })
}

function combat_simulate() {
    $('#btn-simulate').prop('disabled', true)
    const address = $('#combat-address').val()
    const weapData = $('#combat-weapon').val()
    const charData = $('#combat-character').val()
    $('#combat-result').html('Generating results...')
    $.get(`/simulate/${address}/${weapData}/${charData}`, (result, err) => {
        if (result.error) $('#combat-result').html(result.error)
        else {
            let tmpResult = 'Enemy | Element | Power | Chance<br><hr>';
            result.forEach((data, i) => {
                tmpResult += `#${i+1} | ${elemToColor(data.enemy.element)} | ${data.enemy.power} | ${parseFloat(data.chance * 100).toFixed(2)}%<br>`
            })
            $('#combat-result').html(tmpResult)
        }
        $('#btn-simulate').removeAttr('disabled')
    })
}

function rename(address) {
    $('#inp-rename').val(storeNames[address])
    $('#inp-readdress').val(address)
    $('#modal-rename-account').modal({
        backdrop: 'static',
        keyboard: false
    })
}

function addressPrivacy(address) {
    return `${address.substr(0, 6)}...${address.substr(-4, 4)}`
}

if (hideAddress) {
    $('#btn-privacy').removeAttr('checked')
} else {
    $('#btn-privacy').prop('checked', true)
}

$('#btn-privacy').on('change' , (e) => {
    if (e.currentTarget.checked) {
        togglePrivacy(false)
    } else {
        togglePrivacy(true)
    }
})

$("#select-currency").on('change', (e) => {
    currCurrency = e.currentTarget.value
    localStorage.setItem('currency', currCurrency)
    refresh()
})

function togglePrivacy (hide) {
    if (hide) {
        hideAddress = true
        localStorage.setItem('hideAddress', true)
    } else {
        hideAddress = false
        localStorage.setItem('hideAddress', false)
    }
    refresh()
}

function export_data() {
    getLocalstorageToFile(`CBTracker-${new Date().getTime()}.json`)
}

function import_data() {               
    if (!window.File || !window.FileReader || !window.FileList || !window.Blob) {
        return alert('The File APIs are not fully supported in this browser.');
    }   

    var input = document.getElementById('file-import');
    if (!input) {
        return alert("Um, couldn't find the fileinput element.");
    }
    if (!input.files) {
        alert("This browser doesn't seem to support the `files` property of file inputs.");
    }
    if (!input.files[0]) {
        alert("Please select a file before clicking 'Import'");               
    }
    if (input.files[0].type != 'application/json') {
        alert("Please import a valid .json file");               
    }
    var file = input.files[0];
    var fr = new FileReader();
    fr.readAsText(file);
    fr.addEventListener('load', function() {
        var {accounts, currency, hideAddress, names} = JSON.parse(fr.result)
        storeAccounts = JSON.parse(accounts)
        storeNames = JSON.parse(names)
        hideAddress = (hideAddress === 'true')
        togglePrivacy(hideAddress)
        toggleHelper(hideAddress)
        currCurrency = currency
        localStorage.setItem('currency', currCurrency)    
        refresh()
        $('#modal-import').modal('hide')
    });  
}

function toggleHelper(hide) {
    if (hide) {
        $('.toggle.btn.btn-sm').removeClass('btn-primary')
        $('.toggle.btn.btn-sm').addClass('btn-danger off')
    } else {
        $('.toggle.btn.btn-sm').addClass('btn-primary')
        $('.toggle.btn.btn-sm').removeClass('btn-danger off')
    }
}

function getLocalstorageToFile(fileName) {
    var a = {};
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      var v = localStorage.getItem(k);
      a[k] = v;
    }
    var textToSave = JSON.stringify(a)
    var textToSaveAsBlob = new Blob([textToSave], {
      type: "text/plain"
    });
    var textToSaveAsURL = window.URL.createObjectURL(textToSaveAsBlob);    
    var downloadLink = document.createElement("a");
    downloadLink.download = fileName;
    downloadLink.innerHTML = "Download File";
    downloadLink.href = textToSaveAsURL;
    downloadLink.onclick = function () {
      document.body.removeChild(event.target);
    };
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}