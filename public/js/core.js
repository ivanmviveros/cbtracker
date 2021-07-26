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

getSkillPrice()

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
            populate_cards(result)
            $table.bootstrapTable({data: result, classes: 'table table-bordered'})
            $table.bootstrapTable('hideLoading')
        })        
    }
}

function add_account() {
    var address = $('#inp-address').val().trim()
    var name = $('#inp-name').val().trim()
    if (storeAccounts.find(account => account === address)) return
    $.get(`/account/add/${address}`, (result) => {
        if(result.valid) {
            $('#modal-add-account').modal('hide');
            storeAccounts.push(address)
            storeNames[address] = name
            reload_data()
        }
    })
}

function rename_account() {
    var address = $('#inp-readdress').val().trim()
    var name = $('#inp-rename').val().trim()
    $('#modal-rename-account').modal('hide');
    storeNames[address] = name
    reload_data()
}

function reload_data() {
    localStorage.setItem('accounts', JSON.stringify(storeAccounts))
    localStorage.setItem('names', JSON.stringify(storeNames))

    $table.bootstrapTable('showLoading')
    $.get(`/account/retrieve/${window.btoa(JSON.stringify(storeAccounts))}`, (result) => {
        populate_cards(result)
        $table.bootstrapTable('load', result)
        $table.bootstrapTable('hideLoading')
    })
}

function populate_cards(result) {
    let uskills = 0, sskills = 0, balance = 0, chars = 0
    result.forEach(data => {
        uskills += parseFloat(data.unclaimed)
        sskills += parseFloat(data.rewards)
        balance += parseFloat(data.balance)
        chars += data.characters.length
    })    
    $('#card-acc').html(`${result.length}${(chars > 0) ? ` (${chars} Characters)` : ''} `)
    $('#card-uskills').html(convertSkill(uskills))
    $('#card-sskills').html(convertSkill(sskills))
    $('#card-balance').html(convertSkill(balance))
}

function charFormatter(val) {
    return val.map(char => {
        return `${char.charId} | ${char.level} | ${char.element} | ${char.exp} | ${char.nextLevel} (${(char.nextExp > 0 ? `${char.nextExp} exp left` : 'Claim Exp')}) | (${char.sta}/200)`
    }).join('<br>')
}

function currFormatter(val) {
    return parseFloat(val).toFixed(6)
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

function getSkillPrice() {
    $.get(`https://api.coingecko.com/api/v3/simple/price?ids=cryptoblades,binancecoin&vs_currencies=${currencies.join(',')}`, (result) => {
        skillPrice = result.cryptoblades[currCurrency]
        $('#card-price').html(skillPrice.toLocaleString('en-US', { style: 'currency', currency: currCurrency.toUpperCase() }))
    })
}

function convertSkill(value) {
    return (parseFloat(value) > 0 ? `${parseFloat(value).toFixed(6)} (${(parseFloat(value) * parseFloat(skillPrice)).toLocaleString('en-US', { style: 'currency', currency: currCurrency.toUpperCase() })})` : 0)
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
    characters.forEach(character => {
        $("#combat-character").append(new Option(`${character.charId} | ${character.element} | Lv. ${character.level}`, character.charId));
    })
    weapons.forEach(weapon => {
        $("#combat-weapon").append(new Option(`${weapon.id} | ${weapon.stars + 1}-star ${weapon.element}`, weapon.id));
    })
    $('#modal-combat').modal({
        backdrop: 'static',
        keyboard: false
    })
}

function combat_simulate() {
    $('#btn-simulate').prop('disabled', true)
    const address = $('#combat-address').val()
    const weapId = $('#combat-weapon').val()
    const charId = $('#combat-character').val()
    $('#combat-result').html('Generating results...')
    $.get(`/simulate/${address}/${charId}/${weapId}`, (result, err) => {
        if (result.error) $('#combat-result').html(result.error)
        else {
            let tmpResult = '';
            result.forEach((data, i) => {
                tmpResult += `Enemy ${i+1} | ${data.enemy.element} | ${data.enemy.power} | ${parseFloat(data.chance * 100).toFixed(2)}%<br>`
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
    $('#btn-privacy').prop('checked', true)
} else {
    $('#btn-privacy').removeAttr('checked')
}

$('#btn-privacy').on('change' , (e) => {
    if (e.currentTarget.checked) {
        togglePrivacy(true)
    } else {
        togglePrivacy(false)
    }
})

$("#select-currency").on('change', (e) => {
    currCurrency = e.currentTarget.value
    localStorage.setItem('currency', currCurrency)    
    getSkillPrice()
    reload_data()
})

function togglePrivacy (hide) {
    if (hide) {
        hideAddress = true
        localStorage.setItem('hideAddress', true)
    } else {
        hideAddress = false
        localStorage.setItem('hideAddress', false)
    }
    reload_data()
}