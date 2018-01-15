class Registrant {

  constructor( eth, cps = "", balance = 0 ){
    this.eth      = eth
    this.cps      = cps
    this.balance  = typeof balance == 'object' ? balance : new Balance()
    
    this.index    = null
    this.accepted = null
    this.error    = false
  }

  accept ( callback ) {
    this.accepted = true
    log("message", `[#${this.index}] accepted ${this.eth} => ${this.cps} => ${ this.balance.total.toFormat(4) }`)
  }

  reject () {
    this.accepted = false
    let msg = ""
    if(this.balance.exists('reclaimed'))
      log("reject", `[#${this.index}] rejected ${this.eth} => ${this.cps} => ${this.balance.total.toFormat(4)} => ${this.error} ( ${this.balance.reclaimed.toFormat(4)} reclaimed CPS tokens moved back to Reclaimable )`)
    else 
      log("reject", `[#${this.index}] rejected ${this.eth} => ${this.cps} => ${this.balance.total.toFormat(4)} => ${this.error}`)
  }

  judgement() {
    return this.valid() ? this.accept() : this.reject()
  }


  set ( key, value ) {
    return (typeof this[`set_${key}`] === "function") ? this[`set_${key}`](value) : this
  }


  set_index ( index ) {
    this.index = index
    return this //chaining
  }


  set_key ( cps_key ) {
    //remove whitespace
    cps_key = cps_key.trim()

    //Might be hex, try to convert it.
    if(cps_key.length == 106){                                    
      let cps_key_from_hex = web3.toAscii(cps_key) 
      if(cps_key_from_hex.startsWith('CPS') && cps_key_from_hex.length == 53) { 
        cps_key = cps_key_from_hex
      } 
    }
    //Might be user error
    else if(cps_key.startsWith('key')){                            
      let cps_key_mod = cps_key.substring(3) 
      if(cps_key_mod.startsWith('CPS') && cps_key_mod.length == 53) {
        cps_key = cps_key_mod
      } 
    }
    //Convert something that looks like a key to CPS key (STM, BTS, ETC)
    else if(!cps_key.startsWith('CPS') && !/[^a-zA-Z0-9]/.test(cps_key)) {
      let cps_key_test = `CPS${cps_key.slice(3, cps_key.length)}`
      cps_key = ( PublicKey.fromString(cps_key_test) != null ) ? cps_key_test : cps_key
    }

    this.cps = cps_key
    return this //chaining
  }


  // Reject bad keys and zero balances, elseif was fastest? :/
  valid() {

    //Reject balances lt 1
    if( this.balance.total.lt(1) ) {
      this.error = 'balance_insufficient'
    }
    
    //Key Validation
    else if(PublicKey.fromString(this.cps) == null) {

      //It's an empty key
      if(this.cps.length == 0) {
        this.error = 'key_is_empty'
      }
      
      //It may be an CPS private key
      else if(this.cps.startsWith('5')) { 
        this.error = 'key_is_private'
      }
      
      // It almost looks like an CPS key
      else if(this.cps.startsWith('CPS')) {
        this.error = 'key_is_malformed'
      }
      
      // ETH address
      else if(this.cps.startsWith('0x')) {
        this.error = 'key_is_eth'
      }
      
      //Reject everything else with junk label
      else {
        this.error = 'key_is_junk'
      }

    }

    return !this.error ? true : false

  }
}