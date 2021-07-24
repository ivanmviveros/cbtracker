var accounts = localStorage.getItem('accounts')
var names = localStorage.getItem('names')
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
    let uskills = 0, sskills = 0, balance = 0
    result.forEach(data => {
        uskills += parseFloat(data.unclaimed)
        sskills += parseFloat(data.rewards)
        balance += parseFloat(data.balance)
    })    
    $('#card-acc').html(result.length)
    $('#card-uskills').html(convertSkill(uskills))
    $('#card-sskills').html(convertSkill(sskills))
    $('#card-balance').html(convertSkill(balance))
}

function charFormatter(val) {
    return val.map(char => {
        return `ID: ${char.charId} | Unclaimed Exp: ${char.exp} | Stamina: (${char.sta}/200)`
    }).join('<br>')
}

function currFormatter(val) {
    return parseFloat(val).toFixed(6)
}

function nameFormatter(val) {
    return storeNames[val]
}

function getSkillPrice() {
    $.get('https://api.coingecko.com/api/v3/simple/price?ids=cryptoblades,binancecoin&vs_currencies=php', (result) => {
        skillPrice = result.cryptoblades.php
        $('#card-price').html(skillPrice.toLocaleString('en-PH', { style: 'currency', currency: 'PHP' }))
    })
}

function convertSkill(value) {
    return `${parseFloat(value).toFixed(6)} (${(parseFloat(value) * parseFloat(skillPrice)).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })})`
}

function remove(address) {
    storeAccounts.splice(storeAccounts.indexOf(address), 1);
    delete storeNames[address]
    reload_data()
}