import { AsyncTypeahead } from 'react-bootstrap-typeahead'
import { useState } from 'react';
const { 
    REACT_APP_API_DOMAIN
} = process.env

const TokenSearch = ({ onTokenSelected }) => {

    const [isSearchLoading, setIsSearchLoading] = useState(false);
    const [searchOptions, setSearchOptions] = useState([])

    const handleSearchChange = async (query) => {
        setIsSearchLoading(true)
        const r = await fetch(`${REACT_APP_API_DOMAIN}/token/search/${query}`)
        const newOptions = await r.json()
        newOptions.sort((a, b) => a.score > b.score ? -1 : 1)
        setSearchOptions(newOptions)
        setIsSearchLoading(false)
      }

    const searchToken = async () => {

    }

    return (
        <div style={{ display: 'flex', marginRight: '125px' }}>
            <AsyncTypeahead
                filterBy={() => true}
                style={{ width: '275px' }}
                id="searchbar"
                isLoading={isSearchLoading}
                onSearch={handleSearchChange}
                minLength={3}
                options={searchOptions}
                labelKey="address"
                placeholder="Search for a token..."
                renderMenuItemChildren={(option, props) => {
                return (
                    <div onClick={ () => onTokenSelected(option) }>
                    <p style={{ color: 'black', fontSize: '14px' }}>{option.name} ({option.symbol.toUpperCase()})</p>
                    <p style={{ color: 'black', fontSize: '10px' }}>{option.address}</p>
                    </div>
                )}}
            />
            <button
                className="btn btn-secondary"
                onClick={searchToken}
                style={{
                    paddingLeft: '20px',
                    paddingRight: '20px',
                    height: '38px',
                    marginLeft: '-5px',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    zIndex: 2
                }}
            >
                <i className="tim-icons icon-zoom-split" style={{ color: "white" }} />
            </button>
        </div>
    )
}

export default TokenSearch