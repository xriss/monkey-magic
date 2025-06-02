// ==UserScript==
// @name         Crunchyroll TV
// @namespace    https://github.com/xriss/monkey-magic
// @version      1.250602.3
// @description  Arrow key navigation of Crunchyroll site.
// @author       Qwyzz
// @match        https://*.crunchyroll.com/*
// @icon         data:image/gif;base64,R0lGODlhIAAgAPABAP///wAAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQFCAABACwAAAAAIAAgAAACPYyPqcvtD6OctNqLs36g+w8CVEh6Y0meKIiVW+BusTZXa6jeXa7zd874ABfCSVFxjCQRy5fzCY1Kp9TqogAAOw==
// @grant        none
// ==/UserScript==

(function() {
	'use strict';

	document.head.appendChild(document.createElement("style")).innerHTML=`

	.TVHAX-hide { display : none ; }
	.TVHAX-focus { border : 1px solid white ; }

/* hide the menu since we cant operate it */
	[class^='app-layout__header'] { display : none ; }
	
	.video-player-spacer { max-height : 100vh !important ; }

	html { scrollbar-width: none; }

	`


	let posinside=function(e,p)
	{
		let r=e.getBoundingClientRect(e)
		if( p[0] < window.scrollX+r.left   ) { return false }
		if( p[0] > window.scrollX+r.right  ) { return false }
		if( p[1] < window.scrollY+r.top    ) { return false }
		if( p[1] > window.scrollY+r.bottom ) { return false }
		return true
	}
	let getsiz=function(e)
	{
		let r=e.getBoundingClientRect(e)
		return Math.abs( (r.right-r.left) * (r.bottom-r.top) )
	}

	let getpos=function(e)
	{
		let r=e.getBoundingClientRect(e)
		let epos=[window.scrollX+((r.left+r.right)/2),window.scrollY+((r.top+r.bottom)/2)]
		return epos
	}
	let getmin=function(e)
	{
		let r=e.getBoundingClientRect(e)
		let epos=[r.left-((r.left+r.right)/2),r.top-((r.top+r.bottom)/2)]
		return epos
	}
	let getmax=function(e)
	{
		let r=e.getBoundingClientRect(e)
		let epos=[r.right-((r.left+r.right)/2),r.bottom-((r.top+r.bottom)/2)]
		return epos
	}

	let navi=function(dir)
	{

		// find all elements we might want to focus
		let es=Array.from(document.getElementsByTagName("a"))
		.concat( Array.from(document.getElementsByTagName("button")) )
		.concat( Array.from(document.getElementsByTagName("div")) )
		.filter(function(e){return e.getAttribute("tabindex")=="0"})
		.filter(function(e){return !e.classList.contains("as")})
		// remove some more dodgy ones
		for( let idx=es.length-1 ; idx>=0 ; idx-- )
		{
			let e=es[idx]
			let keep=true

			for (const v of e.classList.values() )
			{
				for( let s of
					[
					"user-menu",
					"menu-item",
					"erc-menu",
					"browse-menu",
					"browse-submenu",
				] )
				{
					if( v.startsWith(s) ) // these are invisible and muck up the navigation
					{
						keep=false
					}
				}

				for( let p=e.parentElement ; p.parentElement ; p=p.parentElement )
				{
					for (const v of p.classList.values() )
					{
						if( v.startsWith("header-") ) // keep away from header
						{
							keep=false
						}
					}
				}
			}
			if(!keep)
			{
				es.splice(idx,1)
			}
	   }

		let apos=[0,0]
		if( document.activeElement ) { apos=getpos(document.activeElement) }

		// find current focus
		let best=null
		let best_dd=Number.MAX_VALUE
		for( let e of es)
		{
			e.classList.remove("TVHAX-focus")

			let epos=getpos(e)
			let dpos=[epos[0]-apos[0],epos[1]-apos[1]]
			let dd=dpos[0]*dpos[0]+dpos[1]*dpos[1]
			if( (!best) || (dd<best_dd) ) { best=e ; best_dd=dd }
		}

		let adjacent=function(dir,prp)
		{
			if(!best) { return }

			let getdir=function(a) { return a[0]*dir[0] + a[1]*dir[1] }
			let getprp=function(a) { return a[0]*prp[0] + a[1]*prp[1] }

			let apos=getpos(best)
			let edge = Math.max( 0 , getdir( getmin(best) ) , getdir( getmax(best) ) )

			let adj=null
			let adj_dd=Number.MAX_VALUE
			for( let e of es)
			{
				if(e==best) { continue } // do not consider the current focus

				let epos=getpos(e)
				let dpos=[epos[0]-apos[0],epos[1]-apos[1]]

				let ddir=getdir(dpos)
				let dprp=getprp(dpos)

				if( ddir > edge ) // MUST be in this direction and past the edge of this element so we dont get stuck
				{
					if( Math.abs(ddir)*0.5 >= Math.abs(dprp) ) // not too big an angle
					{
						if( Math.abs(ddir*dprp) <= Math.abs( window.innerWidth*window.innerHeight) ) // not too big a distance
						{
							let dd= ddir + Math.abs(dprp*2)

							if( (!adj) || (dd<adj_dd) ) { adj=e ; adj_dd=dd }
						}
					}
				}
			}
			if(adj)
			{
				best=adj
			}
		}

		switch(dir)
		{
			case "left":
				adjacent([-1, 0],[0,1])
			break;
			case "right":
				adjacent([ 1, 0],[0,1])
			break;
			case "up":
				adjacent([ 0,-1],[1,0])
			break;
			case "down":
				adjacent([ 0, 1],[1,0])
			break;
		}

		if(best)
		{
			// dont select child elements?
			for( let e of es)
			{
				if( posinside(e,getpos(best)) )
				{
					if( getsiz(e) > getsiz(best) )
					{
						best=e
					}
				}
			}

//            console.log(best)
//			best.classList.add("TVHAX-focus")
			best.scrollIntoView({ behavior: "instant", block: "nearest", inline: "nearest" })
			best.focus()
		}
	}
// need to listen for keys
	document.addEventListener("keydown", function(e) {
//        console.log(e)

		let mine=false

		let dir="none"
		if(e.code=="ArrowLeft")  { dir="left"  ; mine=true }
		if(e.code=="ArrowRight") { dir="right" ; mine=true }
		if(e.code=="ArrowUp")    { dir="up"    ; mine=true }
		if(e.code=="ArrowDown")  { dir="down"  ; mine=true }
		navi(dir)


		if( (e.code=="Escape") || (e.code=="Back")  )
		{
			mine=true
			history.back()
		}
		if( (e.code=="Enter")  || (e.code=="Space") )
		{
			mine=true
			document.activeElement.click()
		}
		
		if(mine)
		{
			e.preventDefault()
			e.stopPropagation()
		}

})

})();
