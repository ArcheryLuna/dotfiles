<?php

namespace LanguageServer\Factory;

use LanguageServerProtocol\Location;
use LanguageServerProtocol\Position;
use LanguageServerProtocol\Range;
use Microsoft\PhpParser\Node;
use Microsoft\PhpParser\PositionUtilities;

class LocationFactory
{
    /**
     * Returns the location of the node
     *
     * @param Node $node
     * @return Location
     */
    public static function fromNode(Node $node): Location
    {
        $range = PositionUtilities::getRangeFromPosition(
            $node->getStartPosition(),
            $node->getWidth(),
            $node->getFileContents()
        );

        return new Location($node->getUri(), new Range(
            new Position($range->start->line, $range->start->character),
            new Position($range->end->line, $range->end->character)
        ));
    }
}
